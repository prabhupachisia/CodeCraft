import { useEffect, useState } from "react";
import { Editor } from "./Editor";
import { File, RemoteFile, Type } from "./external/editor/utils/file-manager";
import { useSearchParams } from "react-router-dom";
import styled from "@emotion/styled";
import { Output } from "./Output";
import { TerminalComponent as Terminal } from "./Terminal";
import { Socket, io } from "socket.io-client";
import { EXECUTION_ENGINE_URI } from "../config";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 10px;
`;

const Workspace = styled.div`
  display: flex;
  width: 100%;
`;

const LeftPanel = styled.div`
  flex: 1;
`;

const RightPanel = styled.div`
  flex: 1;
`;

function useSocket(replId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!replId) {
      console.error("No replId provided, cannot establish socket connection");
      return;
    }

    const newSocket = io(EXECUTION_ENGINE_URI, {
      transports: ["websocket", "polling"],
      query: { roomId: replId },
      withCredentials: true, // Ensures cookies are sent
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    newSocket.on("disconnect", () => {
      console.warn("Socket disconnected.");
      setSocket(null); // Reset socket state on disconnect
    });

    return () => {
      newSocket.disconnect();
    };
  }, [replId]);

  return socket;
}

export const CodingPage = () => {
  const [searchParams] = useSearchParams();
  const replId = searchParams.get("replId") ?? "";
  const [loaded, setLoaded] = useState(false);
  const socket = useSocket(replId);
  const [fileStructure, setFileStructure] = useState<RemoteFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [showOutput, setShowOutput] = useState(false);

  useEffect(() => {
    if (!socket) return;

    console.log("Socket connected:", socket.id);

    const handleLoaded = ({ rootContent }: { rootContent: RemoteFile[] }) => {
      setLoaded(true);
      setFileStructure(rootContent);
    };

    socket.on("loaded", handleLoaded);
    socket.on("connect_error", (err) => console.error("Socket error:", err));
    socket.on("disconnect", () => console.warn("Socket disconnected."));

    return () => {
      socket.off("loaded", handleLoaded);
    };
  }, [socket]);

  const onSelect = (file: File) => {
    if (!socket) return;

    if (file.type === Type.DIRECTORY) {
      socket.emit("fetchDir", file.path, (data: RemoteFile[]) => {
        setFileStructure((prev) => [
          ...prev,
          ...data.filter((f) => !prev.some((p) => p.path === f.path)),
        ]);
      });
    } else {
      socket.emit("fetchContent", { path: file.path }, (data: string) => {
        setSelectedFile({ ...file, content: data });
      });
    }
  };

  if (!loaded) return "Loading...";

  return (
    <Container>
      <ButtonContainer>
        <button onClick={() => setShowOutput(!showOutput)}>See output</button>
      </ButtonContainer>
      <Workspace>
        <LeftPanel>
          <Editor
            socket={socket}
            selectedFile={selectedFile}
            onSelect={onSelect}
            files={fileStructure}
          />
        </LeftPanel>
        <RightPanel>
          {showOutput && <Output />}
          <Terminal socket={socket} />
        </RightPanel>
      </Workspace>
    </Container>
  );
};
