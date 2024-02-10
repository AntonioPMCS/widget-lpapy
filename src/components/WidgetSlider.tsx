import { Box, Slider, Typography } from '@mui/material'
import React from 'react'

// Format the price to USD using the locale, style, and currency.
let USDollar = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});


type SliderProps = {
  value:number;
  min:number;
  max:number;
  handleChange: any;
  label:string;
  unit:string;

}


const WidgetSlider = ({label, value, min, max, handleChange, unit }:SliderProps) => {

  return (
    <>
      <Box sx={{ width: 250, }}>
        <Box sx={{ display: 'flex', alignItems: 'center' ,  justifyContent: 'space-between' }}>
          <Typography variant="h6">{label}:</Typography>
          <Typography variant="h4">{unit === "$"? `${USDollar.format(value)}` : `${value}${unit}`}</Typography>
        </Box>
        <Slider 
          aria-label="7DayVolume" 
          value={value} 
          min={min}
          max={max}
          onChange={handleChange}
        /> 
      </Box>
    </>
  )
}


export default WidgetSlider
