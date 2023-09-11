# Creating a Custom Chain

In this guide, we will walk through the steps to create a custom chain using the base `Chain` class.

## 1. Extend the Base Chain Class

Your custom chain should inherit from `Chain`.

```python
from langchain.chains.base import Chain


class MyCustomChain(Chain):
    ...
```

## 2. Define Required Attributes

Specify attributes such as prompt, llm, and output_key.

```python
class MyCustomChain(BaseCustomChain):
    prompt: MyPromptTemplate
    llm: MyLanguageModel
    output_key: str = "my_output_key"
```

## 3. Define Input and Output Keys

Use the input_keys and output_keys properties.

```python
@property
def input_keys(self) -> List[str]:
    return self.prompt.input_variables

@property
def output_keys(self) -> List[str]:
    return [self.output_key]

```

## 4. Implement the Call Method

Define the \_call method that lays out the logic of your chain.

```python
def _call(
    self, inputs: Dict[str, Any], run_manager: CallbackManagerForChainRun = None
) -> Dict[str, str]:
    # Your custom chain logic goes here
    # This is just an example that mimics LLMChain
    prompt_value = self.prompt.format_prompt(**inputs)
    # Whenever you call a language model, or another chain, you should pass
    # a callback manager to it. This allows the inner run to be tracked by
    # any callbacks that are registered on the outer run.
    # You can always obtain a callback manager for this by calling
    # `run_manager.get_child()` as shown below.
    response = self.llm.generate_prompt(
        [prompt_value], callbacks=[run_manager.get_child() if run_manager else None]
    )
    # If you want to log something about this run, you can do so by calling
    # methods on the `run_manager`, as shown below. This will trigger any
    # callbacks that are registered for that event.
    if run_manager:
        run_manager.on_text("Log something about this run")
    return {self.output_key: response.generations[0][0].text}
```

## 5. Implement the Async Call Method (Optional)

For asynchronous operations, use the acall method.

```python
async def acall(
    self,
    inputs: Dict[str, Any],
    run_manager: AsyncCallbackManagerForChainRun = None,
) -> Dict[str, str]:
    # Your custom chain logic goes here
    # This is just an example that mimics LLMChain
    prompt_value = self.prompt.format_prompt(**inputs)

    # Whenever you call a language model, or another chain, you should pass
    # a callback manager to it. This allows the inner run to be tracked by
    # any callbacks that are registered on the outer run.
    # You can always obtain a callback manager for this by calling
    # `run_manager.get_child()` as shown below.
    response = await self.llm.agenerate_prompt(
        [prompt_value], callbacks=run_manager.get_child() if run_manager else None
    )

    # If you want to log something about this run, you can do so by calling
    # methods on the `run_manager`, as shown below. This will trigger any
    # callbacks that are registered for that event.
    if run_manager:
        await run_manager.on_text("Log something about this run")

    return {self.output_key: response.generations[0][0].text}
```

### About Return Values for `_call` and `acall`

Both the `_call` and `acall` methods return a dictionary containing a single key-value pair. The key corresponds to `self.output_key`, while the value is the response from the chain's execution. This ensures consistency in how the chain's output is formatted and accessed.

## 6. Specify the Chain Type

This helps in identification.

```python
@property
def _chain_type(self) -> str:
    return "my_custom_chain"
```

### Follow these steps, and you'll have your very own custom chain up and running!
