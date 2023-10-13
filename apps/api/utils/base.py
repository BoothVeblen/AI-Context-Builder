from loguru import logger


def to_string(content):
    if isinstance(content, str):
        return content
    elif isinstance(content, bytes):
        return content.decode()

    else:
        logger.warning(f"type {type(content)} is not supported.")
        return content
