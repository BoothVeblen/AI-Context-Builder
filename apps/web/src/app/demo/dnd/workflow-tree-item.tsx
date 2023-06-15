'use client'

export default function WorkflowTreeItem({
  id,
  clone,
  childCount,
  handleProps,
}: any) {
  function handleClick() {
    console.log('WorkflowTreeItem:', id)
  }

  return (
    <div
      className="relative mb-4 w-[360px] rounded-lg border bg-white p-4"
      {...handleProps}
      onClick={handleClick}
    >
      id: {id}
      {clone && childCount && childCount > 1 ? (
        <span className="absolute right-[-10px] top-[-10px] flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {childCount}
        </span>
      ) : null}
    </div>
  )
}
