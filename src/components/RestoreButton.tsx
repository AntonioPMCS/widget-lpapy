import Button from '@mui/material/Button'
import React from 'react'

type RestoreButtonProps = {
  handleClick: () => void;
}

const RestoreButton = ({handleClick}:RestoreButtonProps) => {
  return (
    <>
      <Button 
        variant="contained"
        onClick={handleClick}
      >↻ Real Values</Button>
    </>
  )
}

export default RestoreButton
