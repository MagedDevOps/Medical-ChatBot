import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  Spinner,
  useToast,
  Stack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';

// استخدام مفتاح API ثابت للاختبار فقط - في الإنتاج استخدم متغيرات البيئة دائمًا
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-3.5-turbo'; // استخدام نموذج أقل تكلفة للاختبار

export default function ChatbotTest() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('medical-chatbot-test-history');
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'مرحباً! أنا نسخة اختبارية من المساعد الطبي. اسألني أي سؤال للتحقق من عمل API.' },
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null); // لتخزين استجابة API الكاملة للتصحيح
  const toast = useToast();
  const chatRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('medical-chatbot-test-history', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setApiResponse(null);
    
    try {
      // طباعة معلومات الطلب للتصحيح
      const requestBody = {
        model: MODEL,
        messages: [
          { role: 'system', content: 'أنت مساعد طبي مفيد. أجب على الأسئلة حول المستشفيات والأدوية والإسعافات الأولية والمعلومات الطبية باللغة العربية.' },
          ...newMessages.slice(-5), // إرسال آخر 5 رسائل فقط لتقليل حجم الطلب
        ],
      };
      
      console.log('Sending request to OpenRouter API:', {
        url: API_URL,
        model: MODEL,
        messageCount: requestBody.messages.length,
        apiKeyPrefix: API_KEY ? API_KEY.substring(0, 10) + '...' : 'Missing API Key'
      });
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Medical Chatbot Test'
        },
        body: JSON.stringify(requestBody),
      });
      
      // التحقق من حالة الاستجابة
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        
        // عرض رسالة خطأ مفصلة
        toast({
          title: `خطأ في الاتصال (${response.status})`,
          description: errorText.length > 100 ? `${errorText.substring(0, 100)}...` : errorText,
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
        
        // إضافة رسالة خطأ إلى المحادثة
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: `⚠️ حدث خطأ في الاتصال: ${response.status}\n${errorText.substring(0, 200)}` 
        }]);
        setLoading(false);
        return;
      }
      
      // تحليل البيانات
      const data = await response.json();
      setApiResponse(data); // تخزين الاستجابة الكاملة للتصحيح
      console.log('API Response:', data);
      
      // التحقق من صحة البيانات
      if (data.choices && data.choices[0]?.message?.content) {
        const assistantMessage = { 
          role: 'assistant', 
          content: data.choices[0].message.content 
        };
        setMessages([...newMessages, assistantMessage]);
        
        toast({
          title: 'تم استلام الرد بنجاح',
          status: 'success',
          duration: 2000,
        });
      } else {
        console.error('Invalid API Response Structure:', data);
        
        // إضافة رسالة خطأ إلى المحادثة
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: `⚠️ تم استلام استجابة غير صالحة من API. يرجى التحقق من وحدة التحكم للحصول على التفاصيل.` 
        }]);
        
        toast({
          title: 'استجابة API غير صالحة',
          description: 'لم يتم العثور على محتوى الرسالة في الاستجابة',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // إضافة رسالة خطأ إلى المحادثة
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: `⚠️ حدث خطأ: ${error.message}` 
      }]);
      
      toast({
        title: 'فشل الاتصال',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <Flex direction="column" w="100%" maxW="500px" h="600px" bg="white" borderRadius="lg" boxShadow="md" p={4}>
      <Text fontSize="lg" fontWeight="bold" mb={2} textAlign="center" color="blue.600">
        اختبار الاتصال بـ OpenRouter API
      </Text>
      
      <Box ref={chatRef} flex="1" overflowY="auto" mb={4} p={2} border="1px solid #eee" borderRadius="md" bg="white">
        <VStack align="stretch" spacing={3}>
          {messages.map((msg, idx) => (
            <Box key={idx} alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'} bg={msg.role === 'user' ? 'blue.50' : 'gray.100'} px={3} py={2} borderRadius="md" maxW="80%">
              <Text color={msg.role === 'user' ? 'blue.800' : 'black'}>{msg.content}</Text>
            </Box>
          ))}
          {loading && <Spinner alignSelf="center" color="blue.500" />}
        </VStack>
      </Box>
      
      {apiResponse && (
        <Box mb={2} p={2} bg="gray.50" borderRadius="md" fontSize="xs" overflowX="auto">
          <Text fontWeight="bold">آخر استجابة API:</Text>
          <Text as="pre" fontSize="xs">{JSON.stringify(apiResponse, null, 2).substring(0, 300)}...</Text>
        </Box>
      )}
      
      <Flex as="form" onSubmit={e => { e.preventDefault(); sendMessage(); }} gap={2}>
        <Input
          placeholder="اكتب سؤالك هنا للاختبار..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          bg="white"
          borderColor="blue.400"
          color="black"
          _placeholder={{ color: 'gray.400' }}
          dir="rtl"
        />
        <Button
          colorScheme="blue"
          onClick={sendMessage}
          isLoading={loading}
          px={6}
        >
          إرسال
        </Button>
      </Flex>
      
      <Flex mt={2} gap={2}>
        <Button
          flex={1}
          colorScheme="red"
          variant="outline"
          size="sm"
          onClick={() => {
            setMessages([
              { role: 'assistant', content: 'مرحباً! أنا نسخة اختبارية من المساعد الطبي. اسألني أي سؤال للتحقق من عمل API.' },
            ]);
            localStorage.removeItem('medical-chatbot-test-history');
            setApiResponse(null);
          }}
        >
          مسح المحادثة
        </Button>
        
        <Button
          flex={1}
          colorScheme="green"
          variant="outline"
          size="sm"
          onClick={() => {
            const testMessage = "اختبار سريع للتحقق من عمل API";
            setInput(testMessage);
            setTimeout(() => sendMessage(), 100);
          }}
        >
          اختبار سريع
        </Button>
      </Flex>
    </Flex>
  );
}