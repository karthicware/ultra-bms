import { BookMarkedIcon, DollarSignIcon, GlobeIcon, ShoppingCartIcon, TicketCheckIcon } from 'lucide-react'

import StatisticsCard, { type StatisticsCardProps } from '@/components/shadcn-studio/blocks/statistics-card-03'

// Statistics card data
const StatisticsCardData: StatisticsCardProps[] = [
  {
    icon: <TicketCheckIcon />,
    title: 'Total Sales',
    value: '$13.4k',
    trend: 'up',
    changePercentage: '+38%',
    badgeContent: 'Last 6 months'
  },
  {
    icon: <ShoppingCartIcon />,
    title: 'Total Orders',
    value: '155K',
    trend: 'up',
    changePercentage: '+22%',
    badgeContent: 'Last 4 months'
  },
  {
    icon: <DollarSignIcon />,
    title: 'Total Profit',
    value: '$89.34k',
    trend: 'down',
    changePercentage: '-16%',
    badgeContent: 'Last One year'
  },
  {
    icon: <BookMarkedIcon />,
    title: 'Bookmarks',
    value: '$1,200',
    trend: 'up',
    changePercentage: '+38%',
    badgeContent: 'Last 6 months'
  },
  {
    icon: <GlobeIcon />,
    title: 'Total Impressions',
    value: '142.8k',
    trend: 'down',
    changePercentage: '-20%',
    badgeContent: 'Last 6 months'
  }
]

const StatisticsCardPreview = () => {
  return (
    <div className='py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8'>
        {StatisticsCardData.map((card, index) => (
          <StatisticsCard
            key={index}
            icon={card.icon}
            title={card.title}
            value={card.value}
            trend={card.trend}
            changePercentage={card.changePercentage}
            badgeContent={card.badgeContent}
          />
        ))}
      </div>
    </div>
  )
}

export default StatisticsCardPreview
