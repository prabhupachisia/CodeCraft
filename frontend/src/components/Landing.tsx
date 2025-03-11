import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "@emotion/styled";

const SLUG_WORKS = [
  "car",
  "dog",
  "computer",
  "person",
  "inside",
  "word",
  "for",
  "please",
  "to",
  "cool",
  "open",
  "source",
];
const SERVICE_URL = "http://localhost:3001";

const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  color: white;
`;

const StyledInput = styled.input`
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const StyledSelect = styled.select`
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const StyledButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

function getRandomSlug() {
  let slug = "";
  for (let i = 0; i < 3; i++) {
    slug += SLUG_WORKS[Math.floor(Math.random() * SLUG_WORKS.length)];
  }
  return slug;
}

export const Landing = () => {
  const [language, setLanguage] = useState("node-js");
  const [replId, setReplId] = useState(getRandomSlug());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  return (
    <Container>
      <Title>Lepl lit</Title>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <StyledInput
        onChange={(e) => setReplId(e.target.value)}
        type="text"
        placeholder="Repl ID"
        value={replId}
      />
      <StyledSelect
        name="language"
        id="language"
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="node-js">Node.js</option>
        <option value="python">Python</option>
      </StyledSelect>
      <StyledButton
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError("");
          try {
            const response = await axios.post(`${SERVICE_URL}/project`, {
              replId,
              language,
            });
            console.log("Project created:", response.data);
            navigate(`/coding/?replId=${replId}`);
          } catch (error) {
            console.error("Error creating project:", error);
            setError("Failed to create project. Please try again.");
          }
          setLoading(false);
        }}
      >
        {loading ? "Starting ..." : "Start Coding"}
      </StyledButton>
    </Container>
  );
};
