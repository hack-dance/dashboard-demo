const LoadingBalls = () => {
  return (
    <div className="flex gap-1">
      <div className="size-1 animate-bounce rounded-full bg-foreground delay-150 duration-500 ease-in-out" />
      <div className="size-1 animate-bounce rounded-full bg-foreground delay-300 duration-500 ease-in-out" />
      <div className="delay-450 size-1 animate-bounce rounded-full bg-foreground duration-500 ease-in-out" />
    </div>
  )
}

export { LoadingBalls }
