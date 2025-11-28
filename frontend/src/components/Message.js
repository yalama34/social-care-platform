import React from "react";

const Message = ({ mess }) => {
    const roleType = mess?.role?.toLowerCase() === "volunteer" ? "chat-message-volunteer" : "chat-message-user";

    return (
        <div className={`chat-message ${roleType}`}>
            <p className="message-username">{mess.role}</p>
            <p className="message-text">{mess.message}</p>
        </div>
    );
}

export default Message;