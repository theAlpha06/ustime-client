import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './ChatContainer.css';
import { baseUrl } from '../API/api';
import { GiHamburgerMenu } from 'react-icons/gi'
import ChatInput from './ChatInput';
import { v4 as uuidv4 } from 'uuid';
import { BsCheckCircle, BsCheckCircleFill, BsCheckLg } from 'react-icons/bs';

function ChatContainer({ currentChat, currentUser, socket, handleResponsive, onlineUsers }) {
  const [messages, setMessages] = useState([]);
  const [arrivalMsg, setArrivalMsg] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null)

  const scrollRef = useRef();
  const getAllMsg = async () => {
    if (currentChat) {
      const response = await axios.post(`${baseUrl}/msg/getallmsg`, {
        from: currentUser._id,
        to: currentChat._id,
      })
      setMessages(response.data);
    }
  }

  const handleClick = () => {
    handleResponsive('messages')
  }

  useEffect(() => {
    getAllMsg();
  }, [currentChat])

  const handleSendMessage = async (msg) => {
    await axios.post(`${baseUrl}/msg/addmessage`, {
      from: currentUser._id,
      to: currentChat._id,
      message: msg,
    });
    socket.current.emit("send-msg", {
      from: currentUser._id,
      to: currentChat._id,
      message: msg,
      timestamp: new Date()
    });
    const msgs = [...messages];
    msgs.push({
      fromSelf: true,
      message: msg,
      timestamp: new Date()
    });
    setMessages(msgs);
  }

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieve", (data) => {
        setArrivalMsg({
          fromSelf: false,
          message: data.message,
          timestamp: data.timestamp
        });
      })
    }
  }, [])

  useEffect(() => {
    if (socket.current) {
      socket.current.on('typing', (data) => {
        setIsTyping(data.typing);
        setCurrentChatId(data.from)
        setTimeout(() => {
          setIsTyping(false);
          setCurrentChatId(null);
        }, 1000);
      })
    }
  }, [])

  useEffect(() => {
    if (arrivalMsg) {
      setMessages((prev) => [...prev, arrivalMsg]);
    }
  }, [arrivalMsg])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages])

  return (
    <div className='chat_messagecontainer'>
      <div className='messagecontainer-header'>
        <div className='currentchat_details'>
          <div className='currentchat_image'>
            <img
              src={`data:image/svg+xml;base64,${currentChat?.avatarImage}`}
              alt=''
            />
          </div>
          <div className='currentChat_name'>
            <h4 className='user_name'>{currentChat.name}</h4>
            <span className='user_status'>
              {
                (Array.isArray(onlineUsers) && onlineUsers?.includes(currentChat._id) && !isTyping) ?
                  'Online' :
                  (isTyping && currentChat._id === currentChatId) ? 'typing...' : 'Offline'
              }
            </span>
          </div>
        </div>
        <div className='hamburger'>
          <GiHamburgerMenu
            size={30}
            onClick={() => handleClick()}
          />
        </div>
      </div>
      <div className='currentChat_messages'>
        <div>
          {
            messages.map((msg) => {
              return (
                <div className='currentchat_msg' ref={scrollRef} key={uuidv4()}>
                  <div
                    className={`message ${msg.fromSelf ? "sended" : "recieved"}`}
                  >
                    <div className='currentchat_content'>
                      <p className='chat_msg'>{msg.message}</p>
                      <span className='msg_time'>
                        {`${new Date(msg.timestamp).getHours()}:${new Date(msg.timestamp).getMinutes()}`}
                      </span>
                    </div>
                    {
                      msg.status === 'sent' ? <BsCheckLg className='msg_status' /> : msg.status === 'delivered' ? <BsCheckCircle className='msg_status' /> : <BsCheckCircleFill className='msg_status' />
                    }
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>
      <div className='currentChat_input'>
        <ChatInput handleSendMessage={handleSendMessage} socket={socket} currentChat={currentChat} currentUser={currentUser} />
      </div>
    </div>
  )
}

export default ChatContainer
