import { Box, Container, VStack, Button, Input, HStack } from "@chakra-ui/react"
import Message from "./component/Message";
import { GoogleAuthProvider, signInWithPopup, getAuth, onAuthStateChanged, signOut } from "firebase/auth"
import { app } from "./firebase";
import { useEffect, useState, useRef } from "react";
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore"


const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
};

const logoutHandler = () => signOut(auth);

function App() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages,setMessages] = useState([]);
  
  const divForScroll = useRef(null);

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      setMessage("")

      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp()
      })
      
      divForScroll.current.scrollIntoView({behavior: "smooth"})

    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {

    const q = query(collection(db,"Messages"),orderBy("createdAt","asc"))

    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data);
    });

    const unsubscribeForMessage =  onSnapshot(q,(snap)=>{
      setMessages(snap.docs.map((item) => {
        const id = item.id;
        return {id, ...item.data()}
      }));
    })

    return () => {
      unsubscribe();
      unsubscribeForMessage()
    }
  },[])
  return (
    <Box bg={"red.50"}>
      {
        user ? (
          <Container h={"100vh"} bg={"white"}>
            <VStack h="full" paddingY={"4"}>
              <Button onClick={logoutHandler} colorScheme={"red"} w={"full"}>
                SignOut
              </Button >

              <VStack h="full" w={"full"} overflow={"auto"} css={{"&::-webkit-scrollbar":{
                display:"none"
              }}}>
                {
                  messages.map(item=>(
                    <Message key={item.id} user={item.uid === user.uid? "me":"other"} text={item.text} uri={item.uri}  />
                  ))
                }
                <div ref={divForScroll}></div>
              </VStack>
              
              <form onSubmit={submitHandler} style={{ width: "100%" }}>
                <HStack>
                  <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter a Message..." />
                  <Button colorScheme="purple" type="submit">
                    Send
                  </Button>
                </HStack>
              </form>
            </VStack>
          </Container>
        ) : (
          <VStack bg={"white"} justifyContent={"center"} h={"100vh"}>
            <Button onClick={loginHandler} bg={"purple.50"}>Sign In With Google</Button>
          </VStack>
        )
      }
    </Box>
  );
}

export default App;
