interface IProps {
  params: { app_id: string }
}

export default async function Page({ params }: IProps) {
  const { app_id } = params
  return <div className="p-2">{app_id}</div>
}
