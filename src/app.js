import React, {useEffect, useState, useRef, Fragment} from 'react'
import * as firebase from './firebase'
import Emoji from 'react-emoji-render'

function useStickyScrollContainer(scrollContainerRef,inputs = []) {
  const [isStuck, setStuck] = useState(true)
  useEffect(() => {
    function handleScroll() {
      const {
        clientHeight,
        scrollTop,
        scrollHeight,
      } = scrollContainerRef.current
      const partialPixelBuffer = 10
      const scrolledUp =
        clientHeight + scrollTop <
        scrollHeight - partialPixelBuffer
      setStuck(!scrolledUp)
    }
    scrollContainerRef.current.addEventListener(
      'scroll',
      handleScroll,
    )
    return () =>
      scrollContainerRef.current.removeEventListener(
        'scroll',
        handleScroll,
      )
  }, [])

  useEffect(
    () => {
      if (isStuck) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight
      }
    },
    [
      scrollContainerRef.current
        ? scrollContainerRef.current.scrollHeight
        : 0,
      ...inputs,
    ],
  )

  return isStuck
}

function checkInView(element,container = element.parentElement) {
  const cTop = container.scrollTop
  const cBottom = cTop + container.clientHeight
  const eTop = element.offsetTop - container.offsetTop
  const eBottom = eTop + element.clientHeight
  const isTotal = eTop >= cTop && eBottom <= cBottom
  const isPartial =
    (eTop < cTop && eBottom > cTop) ||
    (eBottom > cBottom && eTop < cBottom)
  return isTotal || isPartial
}

function useVisibilityCounter(containerRef) {
  const [seenNodes, setSeenNodes] = useState([])

  useEffect(() => {
    const newVisibleChildren = Array.from(
      containerRef.current.children,
    )
      .filter(n => !seenNodes.includes(n))
      .filter(n => checkInView(n, containerRef.current))
    if (newVisibleChildren.length) {
      setSeenNodes(seen =>
        Array.from(
          new Set([...seen, ...newVisibleChildren]),
        ),
      )
    }
  })

  return seenNodes
}

function App() {
  const messegesContainerRef = useRef()
  const [messeges, setMesseges] = useState([])
  const [chatrooms, setChatrooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState('quickboxChat')
  const [username, setUsername] = useState(() =>
    window.localStorage.getItem('geo-chat:username'),
  )
  useStickyScrollContainer(messegesContainerRef, [
    messeges.length,
  ])

  function sendMessege(e) {
    e.preventDefault()
    firebase.addMessege({
      chatroom: currentRoom ? currentRoom : 'quickboxChat',
      username: username || 'anonymous',
      content: e.target.elements.message.value,
    })
    e.target.elements.message.value = ''
    e.target.elements.message.focus()
  }

  useEffect(
    () => {
      const unsubscribe = firebase.subscribe(currentRoom ? currentRoom : 'quickboxChat',
        messeges => {
          setMesseges(messeges)
        },
      )
      return () => {
        unsubscribe()
      }
    },
    [currentRoom, setCurrentRoom]
  )

  // useEffect(
  //   () => {
  //     const chatrooms = firebase.allChatRoooms()
  //     setChatrooms(chatrooms)
  //   }
  // )

  function allChatRooms(e) {
    e.preventDefault()
    const chatrooms = firebase.allChatRoooms()
    setChatrooms(chatrooms)
  }

  function handleUsernameChange(e) {
    const username = e.target.value
    setUsername(username)
    window.localStorage.setItem(
      'geo-chat:username',
      username,
    )
  }

  function setRoom(e, room) {
    e.preventDefault()
    setCurrentRoom(room)
  }

  return (
    <Fragment>
    <div>
      <h3>Current Chatroom: { currentRoom }</h3>
      <label htmlFor="username">Username</label>
      <input
        type="text"
        id="username"
        value={username}
        onChange={handleUsernameChange}
      />
      <form onSubmit={sendMessege}>
        <label htmlFor="message">Message</label>
        <input type="text" id="message" />
        <button type="submit">send</button>
      </form>
      <div
        id="messegesContainer"
        ref={messegesContainerRef}
        style={{
          border: '1px solid',
          height: 500,
          overflowY: 'scroll',
          padding: '10px 20px',
          borderRadius: 6,
          wordBreak: 'break-all',
        }}
      >
        {messeges.map(messege => (
          <div key={messege.id} style={ messege.username === username ? { textAlign:'right', display: 'block'} : { textAlign:'left', display: 'block'}}>
            <div style={{ display:'inline-block', padding: '10px 20px 10px 20px', backgroundColor: messege.username === username ? '#af9570' : '#eee', color: 'black', border: '1px', borderRadius: '5px', marginBottom: '10px' } } >
                <strong>{messege.username}</strong>:{' '}
                <Emoji text={messege.content}/>
            </div>
          </div>
        ))}
        </div>
    </div>
    <div>
        <button onClick={allChatRooms} type="submit">Chatrooms</button>
        {chatrooms && chatrooms.map(roomms => (
          <button onClick={ (event) => setRoom(event, roomms.room)} type='submit' key={roomms.key}>{roomms.room}</button>
        ))}
    </div>
    </Fragment>
  )
}

export default App