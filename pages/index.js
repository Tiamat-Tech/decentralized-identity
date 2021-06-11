import Head from 'next/head'
import CeramicClient from '@ceramicnetwork/http-client'
import { useState } from 'react'
import { IDX } from '@ceramicstudio/idx'
import { EthereumAuthProvider, ThreeIdConnect } from '@3id/connect'
import { DID } from 'dids'
import Web3Modal from 'web3modal'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'

const API_URL = "https://ceramic-clay.3boxlabs.com"
const ceramic = new CeramicClient(API_URL)

export default function Home() {
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')
  const [profile, setProfile] = useState(null)
  const [localDid, setDid] = useState(null)
  const [idxInstance, setIdxInstance] = useState(null)
  async function connect() {
    // const web3Modal = new Web3Modal({
    //   network: 'mainnet',
    //   cacheProvider: true,
    // })

    // const ethProvider = await web3Modal.connect()
    // const addresses = await ethProvider.enable()   
    // const authProvider = new EthereumAuthProvider(ethProvider, addresses[0])

    const addresses = await window.ethereum.enable()
    const threeIdConnect = new ThreeIdConnect()
    const authProvider = new EthereumAuthProvider(window.ethereum, addresses[0])

    await threeIdConnect.connect(authProvider)
    
    const did = new DID({
      provider: threeIdConnect.getDidProvider(),
      resolver: ThreeIdResolver.getResolver(ceramic)
    })

    // set did in local state
    setDid(did)

    // attach did to ceramic instance
    ceramic.setDID(did)    
    // authenticate with ceramic
    await ceramic.did.authenticate()

    const idx = new IDX({ ceramic })
    setIdxInstance(idx)
    console.log('about to get data from idx')
    const data = await idx.get('basicProfile', did.id)
    console.log('this is the data from idx: ', idx)
    setProfile(data)
    readProfile()
  }
  async function updateProfile() {
    if (twitter) profile.twitter = twitter
    if (bio) profile.bio = bio
    const data = await idxInstance.set('basicProfile', profile)
    console.log('data: ', data)
    setProfileData()
  }
  async function readProfile() {
    if (!localDid) return
    const data = await idxInstance.get('basicProfile', localDid.id)
    console.log('data: ', data)
  }
  async function setProfileData() {
    const data = await idxInstance.get('basicProfile', localDid.id)
    setProfile(data)
  }
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <div style={{ height: 'calc(100vh - 200px)', width: 500, margin: '0 auto', display: 'flex', flex: 1 }}>
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-5xl text-center">
              Decentralized Identity
            </h1>
            <p className="text-xl text-center mt-2 text-gray-400">An authentication system built with Ceramic & IDX</p>

            {
              profile && (
                <>
                  <h2 className="text-2xl font-semibold mt-6">{profile.name}</h2>
                  <p className="text-gray-500 text-sm my-1">{profile.bio}</p>
                  <p className="text-lg	text-gray-900">Follow me on Twitter - @{profile.twitter}</p>
                </>
              )
            }

            <button
              onClick={connect}
              className="pt-4 shadow-md bg-purple-800 mt-4 mb-2 text-white font-bold py-2 px-4 rounded"
            >Connect Profile</button>

          <input className="pt-4 rounded bg-gray-100 px-3 py-2 my-2" placeholder="Bio" onChange={e => setBio(e.target.value)} />
          <input className="pt-4 rounded bg-gray-100 px-3 py-2" placeholder="Twitter username" onChange={e => setTwitter(e.target.value)} />
          <button className="pt-4 shadow-md bg-green-500 mt-2 mb-2 text-white font-bold py-2 px-4 rounded" onClick={updateProfile}>Update Profile</button>
          <button className="pt-4 shadow-md bg-blue-500 mb-2 text-white font-bold py-2 px-4 rounded" onClick={readProfile}>Read Profile</button>
        </div>
      </div>
    </div>
  )
}
