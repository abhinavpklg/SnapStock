'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, Tooltip } from '@mui/material'
import { firestore, storage } from '@/firebase'
import {Camera} from "react-camera-pro"
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded';

import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'
import { red } from '@mui/material/colors'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white', 
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

const cameraStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  height: 800,
  border: '2px solid #000',
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

export default function Home() {
  const cameraRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraType, setCameraType] = useState('back');

  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [openCamera, setOpenCamera] = useState(false)
  const [itemName, setItemName] = useState('')

  const [confirmAddItem, setConfirmAddItem] = useState(false);
  const [capturedItemName, setCapturedItemName] = useState('');

  const fetchInventory = async () => {
    try {
      const inventoryCollection = query(collection(firestore, 'inventory'));
      const inventorySnapshot = await getDocs(inventoryCollection);
      const inventoryList = inventorySnapshot.docs.map(doc => ({ name: doc.id, ...doc.data() }));
      setInventory(inventoryList);
    } catch (error) { 
      alert("Error fetching inventory: " + error.message);
    }
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  const addItem = async (item) => {
    try {
      item = (item)?item.toLowerCase():item;
      const inventoryCollection = doc(collection(firestore, 'inventory'), item);
      const inventorySnapshot = await getDoc(inventoryCollection);
      if(inventorySnapshot.exists()){
        const { quantity } = inventorySnapshot.data()
        await setDoc(inventoryCollection, {quantity: quantity + 1})
      } else {
        await setDoc(inventoryCollection, {quantity: 1})
      }
      await fetchInventory()
    } catch (error) {
      alert("Error Adding Item: " + error.message);
    }
  }

  const removeItem = async (item) => {
    try {
      const inventoryCollection = doc(collection(firestore, 'inventory'), item);
      const inventorySnapshot = await getDoc(inventoryCollection);
      if(inventorySnapshot.exists()){
        const {quantity} = inventorySnapshot.data()
        if (quantity === 1){
          await deleteDoc(inventoryCollection)
        } else {
          await setDoc(inventoryCollection, {quantity: quantity - 1})
        }
      await fetchInventory();
    }
    } catch (error) {
      alert("Error removing item: " + error.message);
    }
  }


  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const handleCameraOpen = () => setOpenCamera(true)
  const handleCameraClose = () => setOpenCamera(false)

  // camera functionalities
  const toggleCamera = () => {
    setCameraType((prevType) => (prevType === 'back' ? 'front' : 'back'));
  };

  const uploadImageToFirebase = async (imageSrc) => {
    const storageRef = ref(storage, `images/${Date.now()}.jpg`);
    const response = await fetch(imageSrc);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
  };

  const captureImage = async () => {
    if (cameraRef.current) {
      const imageSrc = await cameraRef.current.takePhoto();
      await uploadImageToFirebase(imageSrc);
      const item =  await identifyItem(imageSrc);
      setCapturedItemName(item);
      setConfirmAddItem(true); 
    }
  };

  const handleConfirmAddItem = async (confirm) => {
    setConfirmAddItem(false);
    if (confirm) {
      await addItem(capturedItemName);
    }
    handleCameraClose();
  };

  const identifyItem = async (imageSrc) => {
    try {
      const response = await fetch('/api/identify-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageSrc: imageSrc }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const itemDetails = await response.json();
      const result = itemDetails.result.trimEnd();
      debugger;
      if (!result) {
        throw new Error('Vision Service is unavailable');
      }
        return result;    
    } catch (error) {
      console.error('Error identifying item:', error);
    }
  };


  return (
    <Box
    width="100vw"
    height="100vh"
    display={'flex'}
    justifyContent={'center'}
    flexDirection={'column'}
    alignItems={'center'}
    gap={2}
  >
    <Typography variant={'h1'} color={'#333'} textAlign={'center'} style={{marginBottom: '20px', fontFamily: 'cursive' }}>
     SnapStock
     </Typography>

     <Stack direction="row" spacing={2} justifyContent="center">
     
     <Button variant="contained" onClick={handleOpen} style={{ padding: '16px 32px', marginRight:'450px'}}>
     <AddCardRoundedIcon style={{ fontSize: '3rem' }}/>
  </Button>
      <Button variant="contained" onClick={handleCameraOpen} style={{ padding: '16px 32px'}}>
      <AddAPhotoIcon style={{ fontSize: '3rem' }}/>
      </Button>
    </Stack>
      
      <Modal
        open={openCamera}
        onClose={handleCameraClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={cameraStyle}>
          <Camera
            ref={cameraRef}
            onTakePhoto={captureImage}
            facingMode={cameraType}
            style={{ width: '100%', height: '100%' }}
          />
          <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
            <Button variant="contained" onClick={captureImage}>
              Capture
            </Button>
            <Button variant="contained" onClick={toggleCamera}>
              Switch Camera
            </Button>
            <Button variant="contained" onClick={handleCameraClose}>
              Close Camera
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={confirmAddItem}
        onClose={() => setConfirmAddItem(false)}
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
      >
        <Box sx={style}>
          <Typography id="confirm-modal-title" variant="h6" component="h2">
            Add Item to Inventory?
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" onClick={() => handleConfirmAddItem(true)}>
              Yes
            </Button>
            <Button variant="outlined" onClick={() => handleConfirmAddItem(false)}>
              No
            </Button>
          </Stack>
        </Box>
      </Modal>
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Add Item
        </Typography>
        <Stack width="100%" direction={'row'} spacing={2}>
          <TextField
            id="outlined-basic"
            label="Item"
            variant="outlined"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <Button
            variant="outlined"
            onClick={() => {
              addItem(itemName)
              setItemName('')
              handleClose()
            }}
          >
            Add
          </Button>
        </Stack>
      </Box>
    </Modal>
    
    <Box border={'1px solid #333'}>
      <Box
        width="700px"
        height="80px"
        bgcolor={'#ADD8E6'}
        display={'flex'}
        justifyContent={'center'}
        alignItems={'center'}
      >
        <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
          Inventory Items
        </Typography>
      </Box>
      
      <Stack width="700px" height="700px" spacing={2} overflow={'auto'}>
        {inventory.map(({name, quantity}) => (

          <Box
            key={name}
            width="100%"
            minHeight="100px"
            display={'flex'}
            justifyContent={'flex-end'}
            alignItems={'center'}
            bgcolor={'#f0f0f0'}
            paddingX={2}
          >
            <Typography variant={'h4'} color={'#333'} textAlign={'center'}style={{marginRight: '120px' }}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </Typography>
            <Typography variant={'h4'} color={'#333'} textAlign={'center'} style={{marginRight: '200px' }}>
              {quantity}
            </Typography>

            <Stack direction="row" spacing={3} justifyContent="center">
            <Button variant="contained" onClick={() => addItem(name)} >
              <AddCircleIcon style={{ fontSize: '2.5rem' }}/>
            </Button>
            <Button variant="contained" onClick={() => removeItem(name)} >
              <RemoveCircleIcon style={{ fontSize: '2.5rem'}}/>
            </Button>
            </Stack>
            
           
          </Box>
        ))}
      </Stack>
    </Box>
  </Box>
  )
}