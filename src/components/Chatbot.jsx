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

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// استخدام نموذج أقل تكلفة بدلاً من gpt-4o
const MODEL = 'openai/gpt-3.5-turbo';
// تحديد الحد الأقصى للرموز لتجنب أخطاء الاعتمادات
const MAX_TOKENS = 1024;

export default function Chatbot() {
  // تحميل المحادثة السابقة من التخزين المحلي أو إنشاء محادثة جديدة
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('medical-chatbot-history');
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'مرحباً! أنا مساعدك الطبي. اسألني عن المستشفيات، الأدوية، الإسعافات الأولية أو أي شيء طبي.' },
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const chatRef = useRef(null);

  const quickQuestions = [
    'ما هي الإسعافات الأولية للنزيف؟',
    'أين أقرب مستشفى؟',
    'ما هي أعراض الإنفلونزا؟',
    'ما هو دواء الباراسيتامول؟',
    'كيف أتعامل مع الحروق البسيطة؟',
  ];

  useEffect(() => {
    localStorage.setItem('medical-chatbot-history', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': import.meta.env.VITE_SITE_URL,
          'X-Title': import.meta.env.VITE_SITE_NAME,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: 'You are a helpful medical assistant. Answer questions about hospitals, medicines, first aid, and medical information in Arabic.' },
            ...newMessages.slice(-5), // إرسال آخر 5 رسائل فقط لتقليل حجم الطلب
          ],
          max_tokens: MAX_TOKENS, // تحديد الحد الأقصى للرموز في الاستجابة
          temperature: 0.7 // إضافة درجة حرارة معتدلة للإجابات
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', res.status, errorText);
        
        // تحسين رسائل الخطأ لتكون أكثر وضوحًا
        let errorMessage = `خطأ في الاتصال: ${res.status}`;
        let errorDescription = '';
        
        try {
          // محاولة تحليل رسالة الخطأ كـ JSON
          const errorJson = JSON.parse(errorText);
          
          // التحقق من وجود رسالة خطأ تتعلق بالاعتمادات أو حد الرموز
          if (errorJson.error && errorJson.error.message) {
            if (errorJson.error.message.includes('more credits') || 
                errorJson.error.message.includes('max_tokens')) {
              errorMessage = 'خطأ في الاعتمادات أو حد الرموز';
              errorDescription = 'تم تجاوز حد الاعتمادات أو الرموز المسموح بها. سنحاول تقليل حجم الطلب.';
              
              // إضافة رسالة للمستخدم
              setMessages([...newMessages, { 
                role: 'assistant', 
                content: 'عذراً، حدثت مشكلة في معالجة طلبك بسبب قيود الاعتمادات أو حد الرموز. يرجى تقصير سؤالك أو المحاولة مرة أخرى لاحقاً.' 
              }]);
            } else {
              errorDescription = errorJson.error.message.substring(0, 150);
            }
          } else {
            errorDescription = `تفاصيل: ${errorText.substring(0, 100)}...`;
          }
        } catch (e) {
          // إذا لم يكن النص JSON صالح
          errorDescription = `تفاصيل: ${errorText.substring(0, 100)}...`;
        }
        
        toast({ 
          title: errorMessage, 
          description: errorDescription,
          status: 'error', 
          duration: 7000,
          isClosable: true
        });
        
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log('API Response:', data);
      
      // التحقق من وجود محتوى في الاستجابة
      if (data.choices && data.choices[0]?.message?.content) {
        // إضافة رد المساعد إلى المحادثة
        setMessages([...newMessages, { role: 'assistant', content: data.choices[0].message.content }]);
      } else {
        console.error('Invalid API Response:', data);
        
        // التحقق من وجود رسالة خطأ محددة في الاستجابة
        let errorMsg = 'لم يتم العثور على محتوى الرسالة في الاستجابة';
        
        // إذا كان هناك رسالة خطأ تتعلق بالاعتمادات، عرض رسالة مناسبة
        if (data.error && data.error.message) {
          if (data.error.message.includes('more credits') || data.error.message.includes('max_tokens')) {
            errorMsg = 'تم تجاوز حد الاعتمادات أو الرموز المسموح بها';
            
            // إضافة رسالة للمستخدم توضح المشكلة
            setMessages([...newMessages, { 
              role: 'assistant', 
              content: 'عذراً، حدثت مشكلة في معالجة طلبك بسبب قيود الاعتمادات أو حد الرموز. يرجى تقصير سؤالك أو المحاولة مرة أخرى لاحقاً.' 
            }]);
          } else {
            // إضافة رسالة خطأ عامة للمستخدم
            setMessages([...newMessages, { 
              role: 'assistant', 
              content: 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.' 
            }]);
          }
        } else {
          // إضافة رسالة خطأ عامة للمستخدم
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: 'عذراً، حدث خطأ في معالجة الاستجابة. يرجى المحاولة مرة أخرى.' 
          }]);
        }
        
        toast({ 
          title: 'حدث خطأ في الرد من الذكاء الاصطناعي.', 
          description: `${errorMsg}: ${JSON.stringify(data).substring(0, 100)}...`,
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    } catch (e) {
      console.error('Connection error:', e);
      toast({ 
        title: 'فشل الاتصال بالخادم.', 
        description: e.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      
      // إضافة رسالة خطأ إلى المحادثة
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'عذراً، حدث خطأ في الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.' 
      }]);
    }
    setLoading(false);
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <Flex direction="column" w="100%" maxW="500px" h="600px" bg="white" borderRadius="lg" boxShadow="md" p={4}>
      <Wrap spacing={2} mb={2} justify="center">
        {quickQuestions.map((q, i) => (
          <WrapItem key={i}>
            <Button size="sm" colorScheme="blue" variant="outline" onClick={() => setInput(q)}>{q}</Button>
          </WrapItem>
        ))}
      </Wrap>
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
      <Flex as="form" onSubmit={e => { e.preventDefault(); sendMessage(); }} gap={2}>
        <Input
          placeholder="اكتب سؤالك الطبي هنا..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
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
      <Button
        mt={2}
        colorScheme="red"
        variant="outline"
        onClick={() => {
          setMessages([
            { role: 'assistant', content: 'مرحباً! أنا مساعدك الطبي. اسألني عن المستشفيات، الأدوية، الإسعافات الأولية أو أي شيء طبي.' },
          ]);
          localStorage.removeItem('medical-chatbot-history');
        }}
      >
        مسح المحادثة
      </Button>
    </Flex>
  );
}