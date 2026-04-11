import React from 'react'
import Hero from '../components/Hero'
import LatestCollection from '../components/LatestCollection'
import BestSeller from '../components/BestSeller'
import OurPolicy from '../components/OurPolicy'
import NewsletterBox from '../components/NewsletterBox'
import CollectionSection from '../components/CollectionSection'

const Home = () => {
  return (
    <div>
      <Hero />
      <LatestCollection />
      <CollectionSection collectionKey='boss' title1='BOSS' title2='COLLECTION' />
      <CollectionSection collectionKey='lacoste' title1='LACOSTE' title2='COLLECTION' />
      <CollectionSection collectionKey='ralph-lauren' title1='RALPH LAUREN' title2='COLLECTION' />
      <CollectionSection collectionKey='jacket' title1='JACKET' title2='COLLECTION' />
      <CollectionSection collectionKey='bloop' title1='BLOOP' title2='COLLECTION' />
      <BestSeller />
      <OurPolicy />
      <NewsletterBox />
    </div>
  )
}

export default Home