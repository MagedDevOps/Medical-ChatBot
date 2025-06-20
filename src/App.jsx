import { Box, Flex, Heading, Image, Button } from '@chakra-ui/react';
import Chatbot from './components/Chatbot';
import logo from './assets/logo.jpg';

export default function App() {
  return (
    <Flex direction="column" minH="100vh" bg="white" color="black" dir="rtl">
      <Box as="header" p={4} boxShadow="sm" bg="white" display="flex" alignItems="center" justifyContent="center" flexDirection="column">
        <Flex alignItems="center" mb={2}>
          <Image src={logo} alt="Logo" boxSize="40px" ml={3} />
          <Heading size="md" textAlign="center">الدردشة الطبية</Heading>
        </Flex>
        <Button 
          size="sm" 
          colorScheme="blue"
        >
          النسخة الأصلية
        </Button>
      </Box>
      <Flex flex="1" justify="center" align="center">
        <Chatbot />
      </Flex>
    </Flex>
  );
}