from celery import Celery
from loguru import logger
from celery.exceptions import MaxRetriesExceededError
from utils.config import UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_PORT
from functools import wraps

from models.base import Model
from models.base.dataset import Dataset
from models.controller import dataset_manager, model_manager, session_state_manager

# cmd: celery -A crontab worker -l INFO
logger.info("Celery Start")
app = Celery('crontab')

# Configuration
broker_host = UPSTASH_REDIS_REST_URL
broker_port = UPSTASH_REDIS_REST_PORT
broker_db = 0
results_db = 0
password = UPSTASH_REDIS_REST_TOKEN

app.conf.broker_url = f"rediss://:{password}@{broker_host}:{broker_port}/{broker_db}?ssl_cert_reqs=CERT_REQUIRED"
app.conf.result_backend = f"rediss://:{password}@{broker_host}:{broker_port}/{results_db}?ssl_cert_reqs=CERT_REQUIRED"

# Optional configuration, see the application user guide.
app.conf.update(
    result_expires=3600,
)


def retry_on_exception(task_func=None, max_retries=3, countdown=60):
    if task_func is None:
        return lambda func: retry_on_exception(func, max_retries=max_retries, countdown=countdown)

    @wraps(task_func)
    def wrapper(task_instance, *args, **kwargs):
        retries = 0
        while retries <= max_retries:
            try:
                return task_func(task_instance, *args, **kwargs)
            except Exception as e:
                retries += 1
                logger.error(f"Error executing task {task_func.__name__}: {e}")
                if retries <= max_retries:
                    try:
                        # use task_instance.retry to retry the task.
                        task_instance.retry(countdown=countdown)
                    except MaxRetriesExceededError:
                        logger.error(f"Max retries exceeded for task {task_func.__name__}")
                        break
                else:
                    break

    return wrapper


@app.task(bind=True)
@retry_on_exception(countdown=10)
def background_create_dataset(self, dataset_dict: dict):
    dataset = Dataset(**dataset_dict)
    dataset_manager.save_dataset(dataset)
    logger.info(f"Dataset {dataset.id} created.")
    # self.update_state(state='PROGRESS', meta={'progress': 100})


@app.task(bind=True)
@retry_on_exception
def background_add_document(self, dataset_id: str, document: dict):
    dataset_manager.add_document_to_dataset(dataset_id, document)
    logger.info(f"Document {document['uid']} added to dataset {dataset_id}.")
    # self.update_state(state='PROGRESS', meta={'progress': 100})


@app.task(bind=True)
@retry_on_exception
def background_delete_dataset(self, dataset_id: str):
    dataset_manager.delete_dataset(dataset_id)
    logger.info(f"Deleted from dataset {dataset_id}.")
    # self.update_state(state='PROGRESS', meta={'progress': 100})


@app.task(bind=True)
@retry_on_exception
def background_delete_document(self, dataset_id: str, document_uid: str):
    dataset_manager.delete_document_from_dataset(dataset_id, document_uid)
    logger.info(f"Document {document_uid} deleted from dataset {dataset_id}.")
    # self.update_state(state='PROGRESS', meta={'progress': 100})


@app.task(bind=True)
@retry_on_exception(countdown=10)
def background_create_model(self, model_dict: dict):
    model = Model(**model_dict)
    model_manager.save_model(model)
    logger.info(f"model: {model} created")
    self.update_state(state='PROGRESS', meta={'progress': 100})


@app.task(bind=True)
@retry_on_exception(countdown=10)
def background_update_model(self, id: str, model: dict):
    model_manager.upsert_model(id, model)
    logger.info(f"model: {model} updated")
    session_state_manager.delete_session_state_cache_via_model(id)
    self.update_state(state='PROGRESS', meta={'progress': 100})
