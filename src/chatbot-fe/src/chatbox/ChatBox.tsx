import { List } from "@mui/material";
import { ListItem } from "@mui/material";
import { ListItemText } from "@mui/material";
import { Paper } from "@mui/material";
import Grid from "@mui/material/Grid";

export const ChatBox = ({
  messages,
}: {
  messages: { text: string; sender: string }[];
}) => {
  return (
    <Paper
      style={{
        height: "80vh",
        width: "100%",
        overflow: "auto",
        marginTop: "10px",
        marginBottom: "10px",
      }}
    >
      <List>
        {messages.map((message, index) => (
          <ListItem key={index}>
            <Grid container>
              <Grid
                item
                xs={12}
                style={{
                  textAlign: message.sender === "User" ? "right" : "left",
                }}
              >
                <ListItemText
                  primary={message.text}
                  secondary={message.sender}
                />
              </Grid>
            </Grid>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
