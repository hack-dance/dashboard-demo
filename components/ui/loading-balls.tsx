const LoadingBalls = () => {
  return (
    <div className="flex gap-1">
      <div className="bg-foreground h-1 w-1 animate-bounce rounded-full delay-150 duration-500 ease-in-out " />
      <div className="bg-foreground h-1 w-1 animate-bounce rounded-full delay-300 duration-500 ease-in-out " />
      <div className="delay-450 bg-foreground h-1 w-1 animate-bounce rounded-full duration-500 ease-in-out " />
    </div>
  )
}

export { LoadingBalls }
