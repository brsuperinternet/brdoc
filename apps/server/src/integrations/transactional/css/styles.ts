export const fontFamily = "HelveticaNeue,Helvetica,Arial,sans-serif";

export const main = {
  backgroundColor: "#edf2f7",
  fontFamily,
};

export const container = {
  backgroundColor: "#ffffff",
  borderColor: "#e8e5ef",
  borderRadius: "2px",
  borderWidth: "1px",
  boxShadow: "0 2px 0 rgba(0, 0, 150, 0.025), 2px 4px 0 rgba(0, 0, 150, 0.015)",
  margin: "10px auto",
  maxWidth: "580px",
};

export const content = {
  padding: "5px 20px 10px 20px",
};

export const paragraph = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: 14,
  lineHeight: 1,
};

export const h1 = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "24px",
  fontWeight: "bold",
  padding: "0",
};

export const logo = {
  alingItems: "center",
  display: "flex",
  justifyContent: "center",
  padding: 4,
};

export const link = {
  textDecoration: "underline",
};

export const footer = {
  margin: "0 auto",
  maxWidth: "580px",
};

export const button = {
  backgroundColor: "#176ae5",
  borderRadius: "3px",
  color: "#fff",
  display: "block",
  fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
  fontSize: "16px",
  padding: "8px",
  textAlign: "center" as const,
  textDecoration: "none",
  width: "100px",
};
