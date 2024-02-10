import { Box, Stack,} from '@mui/material'
import React, { useEffect, useState } from 'react'
import WidgetSlider from './WidgetSlider'
import RestoreButton from './RestoreButton'
import { fetchSLYXPrice, fetchSevenDayVolume, fetchTVL, sLYXToDollar} from '../utils'
import APYDisplay from './APYDisplay'

const DEFAULTS = {
  volume: 100,
  tvl: 250,
  incentives: 0
}

const Widget = () => {
  const [initialVolume, setInitialVolume] = useState(0)
  const [volume, setVolume] = useState(0)

  const [initialTvl, setInitialTvl] = useState(0)
  const [tvl, setTvl] = useState(0)
  const [incentives, setIncentives] = useState(0) // $ value over 7 days

  const [sLYXPrice, setSLYXPrice] = useState(0);

  useEffect(() => {
    // Make the API request
    fetchSLYXPrice(false)
      .then((price:number) => {
        // Set the fetched data to the state
        setSLYXPrice(price);
        console.log(price)
        fetchSevenDayVolume()
        .then((result:bigint) => {
          setInitialVolume(sLYXToDollar(result,price))
          setVolume(sLYXToDollar(result,price))
        })
        fetchTVL()
        .then((result:bigint) => {
          setInitialTvl(sLYXToDollar(result,price))
          setTvl(sLYXToDollar(result,price))
        })
      })


  }, []); 

  const volumeChanged = (event:Event, value:number) => {
    setVolume(value);
  }
  const tvlChanged = (event:Event, value:number) => {
    setTvl(value);
  }
  const incentivesChanged = (event:Event, value:number) => {
    setIncentives(value);
  }

  const restoreDefaults = () => {
    setVolume(initialVolume)
    setTvl(initialTvl)
    setIncentives(DEFAULTS.incentives)
  }

  return (
    <Box gap={6} sx={{mx: 'auto', display: 'flex', alignItems: 'center' , justifyContent: 'space-between', width: 400, }}>
      <Stack spacing={2} direction='column' sx={{mb:1}}>
        <WidgetSlider 
          label="7DayVol"
          value={volume} 
          min={0}
          max={250000}
          handleChange={volumeChanged}
          unit="$"
        />
        <WidgetSlider 
          label="TVL"
          value={tvl} 
          min={0}
          max={1000000}
          handleChange={tvlChanged}
          unit="$"
        />
        <WidgetSlider 
          label="7DayIncentives"
          value={incentives} 
          min={0}
          max={50000}
          handleChange={incentivesChanged}
          unit="$"
        />
      </Stack>
      <Stack spacing={2} direction='column' sx={{mb:1}}>
        <APYDisplay tvl={tvl} volume={volume} incentives={incentives}/>
        <Box pt='20px'>
          <RestoreButton handleClick={restoreDefaults} />
        </Box>

      </Stack>
    </Box>
  )
}

export default Widget
