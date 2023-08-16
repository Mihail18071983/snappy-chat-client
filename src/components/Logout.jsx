import React from "react";
import { useNavigate } from "react-router-dom";
import { BiPowerOff } from "react-icons/bi";
import styled from "styled-components";
import axios from "axios";
import { logoutRoute } from "../utils/APIRoutes";

export default function Logout({ socket }) {
  const navigate = useNavigate();

  const handleClick = async () => {
    const currentUser = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    if (currentUser) {
      try {
        const userId = currentUser._id;
        console.log("Emitting user-offline event");
        socket.emit("user-offline", userId, (acknowledgment) => {
          if (acknowledgment === "success") {
            currentUser.isOnline = false
          }
          else {
          console.log("Error emitting user-offline event");
        }
        });
        const data = await axios.get(`${logoutRoute}/${userId}`);
        if (data.status === 200) {
          localStorage.clear();
          navigate("/login");
        }
      } catch (err) {
        console.log(err);
      }
    }
  };
  return (
    <Button onClick={handleClick}>
      <BiPowerOff />
    </Button>
  );
}

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: #9a86f3;
  border: none;
  cursor: pointer;
  svg {
    font-size: 1.3rem;
    color: #ebe7ff;
  }
`;
