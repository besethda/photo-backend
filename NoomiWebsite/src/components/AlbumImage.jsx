const AlbumImage = ({imageLink}) => {
  return (
    <img className="w-full h-full object-fill" src={`${getImageURL(imageLink)}`}/>
  )
}

export default AlbumImage