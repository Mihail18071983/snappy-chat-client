import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host, updateUserStatusRoute } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  // socket.current = io(host);

  useEffect(() => {
    // Establish the socket connection when the component mounts
    socket.current = io(host);

    // Disconnect the socket when the component unmounts
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    async function checkLogin() {
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
        navigate("/login");
      } else {
        setCurrentUser(
          await JSON.parse(
            localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
          )
        );
      }
    }
    checkLogin();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      // socket.current = io(host);
      socket.current.emit("add-user", currentUser._id);
    }
  }, [currentUser]);

  useEffect(() => {
    async function fetchChatMates() {
      if (currentUser) {
        if (currentUser.isAvatarImageSet) {
          const { data } = await axios.get(
            `${allUsersRoute}/${currentUser._id}`
          );
          console.log("contacts", data);
          setContacts(data);
        } else {
          navigate("/setAvatar");
        }
      }
    }
    fetchChatMates();
  }, [currentUser, navigate]);

  useEffect(() => {
    socket.current.on("user-offline", (userId) => {
      setContacts((prevContacts) =>
        prevContacts.map((contact) => {
          if (contact._id === userId) {
            return { ...contact, isOnline: false };
          }
          return contact;
        })
      );
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      try {
        const userId = currentUser._id;
        console.log("Adding user to socket:", userId);
        socket.current.on("connect", async () => {
          console.log("Connected");
          socket.current.emit("user-online", userId);
          await axios.patch(updateUserStatusRoute, {
            userId,
            isOnline: true,
          });
        });
      } catch (err) {
        console.log(err);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      try {
        const userId = currentUser._id;
        socket.current.on("disconnect", async () => {
          console.log("disconnect");
          socket.current.emit("user-offline", userId);
          await axios.patch(updateUserStatusRoute, {
            userId,
            isOnline: false,
          });
        });
      } catch (err) {
        console.error(err);
      }
      return () => socket.current.disconnect();
    }
  }, [currentUser]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };
  return (
    <>
      <Container>
        <div className="container">
          <Contacts
            contacts={contacts}
            changeChat={handleChatChange}
            socket={socket.current}
          />
          {!currentChat ? (
            <Welcome />
          ) : (
            <ChatContainer currentChat={currentChat} socket={socket.current} />
          )}
        </div>
      </Container>
    </>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;
