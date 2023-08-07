import os

DATABASE_URL = os.environ.get("DATABASE_URL")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
PINECONE_ENVIRONMENT = os.environ.get("PINECONE_ENVIRONMENT")
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
CONVERSION_CHAIN = "conversation_chain"
CONVERSIONAL_RETRIEVAL_QA_CHAIN = "conversational_retrieval_qa_chain"
