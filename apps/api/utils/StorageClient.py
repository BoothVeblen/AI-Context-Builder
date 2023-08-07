import requests
from io import BytesIO


class BaseStorageClient:
    def download(self, uri: str, path: str):
        raise NotImplementedError()


class GoogleCloudStorageClient(BaseStorageClient):
    def download(self, uri: str, path: str):
        response = requests.get(uri)
        with open(path, "wb") as f:
            f.write(response.content)

    def load(self, uri: str):
        response = requests.get(uri)
        return BytesIO(response.content)
