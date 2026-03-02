const AlbumName = ({name}) => {
  return (
    <div className="w-full h-full flex items-center justify-center backdrop-blur-md">
      <p className="w-fit h-fit text-xl text-white">{name}</p>
    </div>
  )
}