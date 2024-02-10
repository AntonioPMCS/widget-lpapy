import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { LP_FEE } from '../constants'
import { calculateStakingRewards, fetchTotalStaked } from '../utils'
import { useEffect, useState } from 'react'

type APIDisplayProps = {
  tvl:number,
  volume:number,
  incentives:number,
}

const APYDisplay = ({tvl, volume, incentives}:APIDisplayProps) => {
 
  const [totalStaked, setTotalStaked] = useState(0);

  function calculateAPY(tvl:number, volume:number, incentives:number) {
    const estimatedYearlyVolume = (volume / 7) * 365
    const lpAPY = ( ((LP_FEE * estimatedYearlyVolume) + incentives) / tvl ) * 100
    const stakingAPR = calculateStakingRewards({ totalAtStake: totalStaked}) * 100
    console.log(stakingAPR)
    console.log(stakingAPR*100 + lpAPY)
    return lpAPY + stakingAPR/2
  }

  useEffect(() => {
    // Make the API request
    fetchTotalStaked()
    .then((result:number | void) => {
      if (result) setTotalStaked(result)
    })
  }, []); 

  return (
    <Box>
      <Typography variant="h5">LP APY:</Typography>
      <Typography variant="h3">{calculateAPY(tvl, volume, incentives).toFixed(2)}%</Typography>
    </Box>
  )
}

export default APYDisplay
