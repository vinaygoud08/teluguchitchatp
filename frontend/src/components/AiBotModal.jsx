import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, Send, Sparkles, X, Trash2, ArrowLeft, MessageSquare, Zap, Smile, 
  Copy, Check, Plus, Camera, Image, FileText, Globe, Search, ChevronDown, 
  Languages, CheckCircle2 
} from 'lucide-react';

export const AI_LANGUAGES = [
  {
    id: 'auto',
    name: 'Auto-Detect / Multilingual',
    nativeName: 'స్వయంచాలకంగా గుర్తించు',
    flag: '🌐',
    category: 'Universal',
    description: 'Replies dynamically matching whatever language you type in',
    greeting: 'హలో! 👋 AI భాష Auto-Detect కు మార్చబడింది. మీరు ఏ భాషలోనైనా నాతో మాట్లాడవచ్చు! ✨'
  },
  {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'పూర్తిగా స్వచ్ఛమైన తెలుగు మరియు తెలుగు-ఇంగ్లీష్ సంభాషణలు',
    greeting: 'నమస్కారం! 🙏 AI భాష తెలుగుగా సెట్ చేయబడింది. మీకు ఎలా సహాయపడగలను? ✨'
  },
  {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🌐',
    category: 'Indian Regional & National',
    description: 'Clear, comprehensive English for coding, general queries, and assistance',
    greeting: 'Hello! 👋 AI language has been set to English. How can I assist you today? ✨'
  },
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'भारत की राजभाषा में सहज और सटीक संवाद',
    greeting: 'नमस्ते! 🙏 AI की भाषा अब हिन्दी सेट कर दी गई है। मैं आपकी क्या सहायता कर सकता हूँ? ✨'
  },
  {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'செம்மொழியான தமிழில் உரையாடுங்கள்',
    greeting: 'வணக்கம்! 🙏 AI மொழி இப்போது தமிழில் அமைக்கப்பட்டுள்ளது. நான் உங்களுக்கு எவ்வாறு உதவ முடியும்? ✨'
  },
  {
    id: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'ಕನ್ನಡದಲ್ಲಿ ನಿಖರವಾದ ಮತ್ತು ಸ್ಪಷ್ಟವಾದ ಮಾಹಿತಿ',
    greeting: 'ನಮಸ್ಕಾರ! 🙏 AI ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಹೊಂದಿಸಲಾಗಿದೆ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? ✨'
  },
  {
    id: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'മലയാളത്തിൽ ലളിതവും വിശദവുമായ മറുപടികൾ',
    greeting: 'നമസ്കാരം! 🙏 AI ഭാഷ ഇപ്പോൾ മലയാളത്തിൽ സജ്ജീകരിച്ചിരിക്കുന്നു. ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം? ✨'
  },
  {
    id: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'मराठीत सोप्या आणि अचूक भाषेत उत्तरे',
    greeting: 'नमस्कार! 🙏 AI भाषा आता मराठीत सेट केली आहे. मी तुम्हाला कशी मदत करू शकतो? ✨'
  },
  {
    id: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'বাংলায় সহজ ও সুন্দর তথ্য ও উত্তর',
    greeting: 'নমস্কার! 🙏 AI ভাষা বাংলায় সেট করা হয়েছে। আমি আপনাকে কীভাবে সাহায্য করতে পারি? ✨'
  },
  {
    id: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'ગુજરાતી ભાષામાં સચોટ અને ઝડપી જવાબો',
    greeting: 'નમસ્તે! 🙏 AI ભાષા હવે ગુજરાતીમાં સેટ થઈ ગઈ છે. હું તમને કેવી રીતે મદદ કરી શકું? ✨'
  },
  {
    id: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'ਪੰਜਾਬੀ ਵਿੱਚ ਸਪੱਸ਼ਟ ਅਤੇ ਮਦਦਗਾਰ ਜਾਣਕਾਰੀ',
    greeting: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! 🙏 AI ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਸੈੱਟ ਕੀਤੀ ਗਈ ਹੈ। ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ? ✨'
  },
  {
    id: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'ଓଡ଼ିଆ ଭାଷାରେ ସଠିକ୍ ଏବଂ ସହଜ ଉତ୍ତର',
    greeting: 'ନମସ୍କାର! 🙏 AI ଭାଷା ଓଡ଼ିଆରେ ସେଟ୍ ହୋଇଛି। ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି? ✨'
  },
  {
    id: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'اردو زبان میں شائستہ اور درست معلومات',
    greeting: 'السلام علیکم! 🙏 AI زبان اب اردو میں سیٹ کر دی گئی ہے۔ میں آپ کی کیا مدد کر سکتا ہوں؟ ✨'
  },
  {
    id: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'অসমীয়া ভাষাত সঠিক আৰু স্পষ্ট তথ্য',
    greeting: 'নমস্কাৰ! 🙏 AI ভাষা অসমীয়াত নিৰ্ধাৰণ কৰা হৈছে। মই আপোনাক কেনেদৰে সহায় কৰিব পাৰোঁ? ✨'
  },
  {
    id: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'प्राचीन-भारतीय-संस्कृत-भाषायां संवादः',
    greeting: 'नमो नमः! 🙏 AI भाषा संस्कृतेन संयोजिता अस्ति। अहं भवतः कथं साहाय्यं कर्तुं शक्नोमि? ✨'
  },
  {
    id: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'कोंकणी भाशेंत सोपे आनी स्पश्ट जाप',
    greeting: 'नमस्कार! 🙏 AI भास कोंकणींत सेट जाली. हांव तुका कशी मदत करूं? ✨'
  },
  {
    id: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'मैथिली भाषामे सुगम संवाद',
    greeting: 'प्रणाम! 🙏 AI केर भाषा मैथिली सेट कएल गेल अछि। हम अहाँक की मद्दति कऽ सकैत छी? ✨'
  },
  {
    id: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    flag: '🇳🇵',
    category: 'Indian Regional & National',
    description: 'नेपाली भाषामा सहज र स्पष्ट उत्तरहरू',
    greeting: 'नमस्ते! 🙏 AI भाषा नेपालीमा सेट गरिएको छ। म तपाईंलाई कसरी सहयोग गर्न सक्छु? ✨'
  },
  {
    id: 'sd',
    name: 'Sindhi',
    nativeName: 'سنڌي / सिन्धी',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'سنڌي ٻوليءَ ۾ واضح جواب',
    greeting: 'سلام! 🙏 AI ٻولي سنڌي ۾ سيٽ ڪئي وئي آهي. مان توهان جي ڪهڙي مدد ڪري سگهان ٿو؟ ✨'
  },
  {
    id: 'ks',
    name: 'Kashmiri',
    nativeName: 'कॉशुर / كٲشُر',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'کٲشُر زبانہِ منٛز جواب',
    greeting: 'سلام! 🙏 AI زَبان گٔیہِ کٲشُر سیٹ۔ بؤ كِتھ کَن کَرِوہ مَدَتھ؟ ✨'
  },
  {
    id: 'doi',
    name: 'Dogri',
    nativeName: 'डोगरी',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'डोगरी भाशा च उत्तर',
    greeting: 'नमस्ते! 🙏 AI भाशा डोगरी च सेट होई गेई ऐ। मैं तुंदी केह् मदद करी सकना? ✨'
  },
  {
    id: 'mni',
    name: 'Manipuri / Meitei',
    nativeName: 'মৈতৈলোন্',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'মৈতৈলোন্দা পাউখুম',
    greeting: 'খুরুমজরি! 🙏 AI লোন মৈতৈলোন্দা সেৎ তৌরে। ঐহাক্না নহাকপু করম্না মতেং পাংগদগে? ✨'
  },
  {
    id: 'brx',
    name: 'Bodo',
    nativeName: 'बर\'',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'बर\' रावजों फिननाय',
    greeting: 'खुलुमबाय! 🙏 AI रावखौ बर\'आव सेट खालामबाय। आं नोंखौ माबोरै हेफाजाब होनो हागोन? ✨'
  },
  {
    id: 'sat',
    name: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    flag: '🇮🇳',
    category: 'Indian Regional & National',
    description: 'ᱥᱟᱱᱛᱟᱲᱤ ᱯᱟᱹᱨᱥᱤ ᱛᱮ ᱛᱮᱞᱟ',
    greeting: 'ᱡᱚᱦᱟᱨ! 🙏 AI ᱯᱟᱹᱨᱥᱤ ᱫᱚ ᱥᱟᱱᱛᱟᱲᱤ ᱛᱮ ᱥᱮᱴ ᱮᱱᱟ᱾ ᱤᱧ ᱪᱮᱫ ᱞᱮᱠᱟᱧ ᱜᱚᱲᱚ ᱫᱟᱲᱮᱭᱟᱢᱟ? ✨'
  },
  {
    id: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    category: 'International',
    description: 'Respuestas fluidas y precisas en español',
    greeting: '¡Hola! 👋 El idioma de la IA se ha configurado en español. ¿En qué puedo ayudarte hoy? ✨'
  },
  {
    id: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    category: 'International',
    description: 'Réponses élégantes et précises en français',
    greeting: 'Bonjour ! 👋 La langue de l\'IA a été réglée sur le français. Comment puis-je vous aider ? ✨'
  },
  {
    id: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    category: 'International',
    description: 'Klare und strukturierte Antworten auf Deutsch',
    greeting: 'Hallo! 👋 Die KI-Sprache wurde auf Deutsch eingestellt. Wie kann ich Ihnen helfen? ✨'
  },
  {
    id: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    category: 'International',
    description: 'إجابات دقيقة وشاملة باللغة العربية',
    greeting: 'أهلاً بك! 👋 تم ضبط لغة الذكاء الاصطناعي إلى العربية. كيف يمكنني مساعدتك اليوم؟ ✨'
  },
  {
    id: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    category: 'International',
    description: '丁寧で正確な日本語のサポート',
    greeting: 'こんにちは！👋 AIの言語が日本語に設定されました。どのようにお手伝いできますか？✨'
  },
  {
    id: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    category: 'International',
    description: '친절하고 정확한 한국어 답변',
    greeting: '안녕하세요! 👋 AI 언어가 한국어로 설정되었습니다. 무엇을 도와드릴까요? ✨'
  },
  {
    id: 'zh',
    name: 'Chinese',
    nativeName: '中文 (简体)',
    flag: '🇨🇳',
    category: 'International',
    description: '流畅而全面的中文回答',
    greeting: '你好！👋 AI语言已设置为中文。请问有什么我可以协助您的？✨'
  },
  {
    id: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    category: 'International',
    description: 'Грамотные и подробные ответы на русском',
    greeting: 'Здравствуйте! 👋 Язык ИИ установлен на русский. Чем я могу вам помочь? ✨'
  },
  {
    id: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    category: 'International',
    description: 'Respostas naturais e precisas em português',
    greeting: 'Olá! 👋 O idioma da IA foi definido para português. Como posso te ajudar hoje? ✨'
  },
  {
    id: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    category: 'International',
    description: 'Risposte fluide ed eleganti in italiano',
    greeting: 'Ciao! 👋 La lingua dell\'IA è stata impostata su italiano. Come posso aiutarti oggi? ✨'
  },
  {
    id: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    category: 'International',
    description: 'Akıcı ve hızlı Türkçe yanıtlar',
    greeting: 'Merhaba! 👋 Yapay zeka dili Türkçe olarak ayarlandı. Bugün size nasıl yardımcı olabilirim? ✨'
  },
  {
    id: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    category: 'International',
    description: 'Jawaban ramah dan cepat dalam Bahasa Indonesia',
    greeting: 'Halo! 👋 Bahasa AI telah diatur ke Bahasa Indonesia. Ada yang bisa saya bantu? ✨'
  },
  {
    id: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    category: 'International',
    description: 'Phản hồi nhanh và chính xác bằng tiếng Việt',
    greeting: 'Xin chào! 👋 Ngôn ngữ AI đã được đặt thành Tiếng Việt. Tôi có thể giúp gì cho bạn hôm nay? ✨'
  },
  {
    id: 'th',
    name: 'Thai',
    nativeName: 'ภาษาไทย',
    flag: '🇹🇭',
    category: 'International',
    description: 'คำตอบที่ชัดเจนและเป็นธรรมชาติในภาษาไทย',
    greeting: 'สวัสดีครับ/ค่ะ! 👋 ภาษาของ AI ถูกตั้งค่าเป็นภาษาไทยแล้ว มีอะไรให้ช่วยเหลือไหมครับ? ✨'
  }
];

function FormattedAiMessage({ content, isBot }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!isBot) {
    return <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>;
  }

  // Clean raw LaTeX notation into readable math
  let text = content || '';
  text = text
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, '∑[$1 to $2]')
    .replace(/\\sum/g, '∑')
    .replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '∫[$1 to $2]')
    .replace(/\\int/g, '∫')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\left\(/g, '(').replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[').replace(/\\right\]/g, ']')
    .replace(/\\left\\\{/g, '{').replace(/\\right\\\}/g, '}')
    .replace(/\\\{/g, '{').replace(/\\\}/g, '}')
    .replace(/\\approx/g, '≈')
    .replace(/\\leq?/g, '≤')
    .replace(/\\geq?/g, '≥')
    .replace(/\\neq?/g, '≠')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\implies/g, '⟹')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt/g, '√')
    .replace(/\^2\b/g, '²').replace(/\^3\b/g, '³').replace(/\^n\b/g, 'ⁿ')
    .replace(/_i\b/g, 'ᵢ').replace(/_1\b/g, '₁').replace(/_2\b/g, '₂').replace(/_3\b/g, '₃')
    .replace(/\$\$/g, '')
    .replace(/\$/g, '');

  const copyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split into code blocks and normal markdown text
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'code',
      code: match[2].trim(),
      index: blockIndex++
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  const renderInline = (str) => {
    if (!str) return '';
    const tokens = [];
    const inlineRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
    let inLast = 0;
    let inMatch;

    while ((inMatch = inlineRegex.exec(str)) !== null) {
      if (inMatch.index > inLast) {
        tokens.push(str.substring(inLast, inMatch.index));
      }
      if (inMatch[2]) {
        tokens.push(<strong key={inMatch.index} style={{ color: '#f8fafc', fontWeight: 700 }}>{inMatch[2]}</strong>);
      } else if (inMatch[3]) {
        tokens.push(<em key={inMatch.index} style={{ color: '#cbd5e1' }}>{inMatch[3]}</em>);
      } else if (inMatch[4]) {
        tokens.push(
          <code key={inMatch.index} style={{
            background: 'rgba(255,255,255,0.12)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.9em',
            color: '#38bdf8'
          }}>
            {inMatch[4]}
          </code>
        );
      }
      inLast = inMatch.index + inMatch[0].length;
    }
    if (inLast < str.length) {
      tokens.push(str.substring(inLast));
    }
    return tokens.length > 0 ? tokens : str;
  };

  const renderTextPart = (partContent, pIdx) => {
    const lines = partContent.split('\n');
    const elements = [];
    let tableRows = [];
    let inTable = false;

    const flushTable = (k) => {
      if (tableRows.length === 0) return;
      const headers = tableRows[0];
      const rows = tableRows.slice(1);
      elements.push(
        <div key={`table-${k}`} style={{ overflowX: 'auto', margin: '12px 0' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.12)',
            fontSize: '0.92rem'
          }}>
            <thead>
              <tr style={{ background: 'rgba(99, 102, 241, 0.25)', borderBottom: '1px solid rgba(255,255,255,0.18)' }}>
                {headers.map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#e0e7ff' }}>
                    {renderInline(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rI) => (
                <tr key={rI} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: rI % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  {row.map((cell, cI) => (
                    <td key={cI} style={{ padding: '9px 14px', color: '#f1f5f9' }}>
                      {renderInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    };

    lines.forEach((line, lIdx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed.slice(1, -1).split('|');
        const isSeparator = cells.every(c => c.trim().match(/^:?-+:?$/));
        if (isSeparator) {
          inTable = true;
        } else {
          tableRows.push(cells);
        }
        return;
      } else {
        if (inTable || tableRows.length > 0) {
          flushTable(lIdx);
        }
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <div key={lIdx} style={{ fontSize: '1.12rem', fontWeight: 800, color: '#a5b4fc', marginTop: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '4px', height: '16px', background: '#6366f1', borderRadius: '2px', display: 'inline-block' }} />
            {renderInline(trimmed.replace(/^###\s*/, ''))}
          </div>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <div key={lIdx} style={{ fontSize: '1.22rem', fontWeight: 800, color: '#c7d2fe', marginTop: '16px', marginBottom: '8px' }}>
            {renderInline(trimmed.replace(/^##\s*/, ''))}
          </div>
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <div key={lIdx} style={{ fontSize: '1.32rem', fontWeight: 800, color: '#ffffff', marginTop: '18px', marginBottom: '10px' }}>
            {renderInline(trimmed.replace(/^#\s*/, ''))}
          </div>
        );
      } else if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={lIdx} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.12)', margin: '14px 0' }} />);
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        elements.push(
          <div key={lIdx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', margin: '4px 0', paddingLeft: '6px' }}>
            <span style={{ color: '#818cf8', fontSize: '1.2rem', lineHeight: '1rem', marginTop: '2px' }}>•</span>
            <div style={{ flex: 1 }}>{renderInline(trimmed.replace(/^[*|-]\s+/, ''))}</div>
          </div>
        );
      } else if (trimmed.match(/^\d+\.\s/)) {
        const numMatch = trimmed.match(/^(\d+\.)\s*(.*)$/);
        elements.push(
          <div key={lIdx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', margin: '4px 0', paddingLeft: '6px' }}>
            <span style={{ color: '#93c5fd', fontWeight: 700, minWidth: '22px' }}>{numMatch ? numMatch[1] : '•'}</span>
            <div style={{ flex: 1 }}>{renderInline(numMatch ? numMatch[2] : trimmed)}</div>
          </div>
        );
      } else if (trimmed === '') {
        elements.push(<div key={lIdx} style={{ height: '6px' }} />);
      } else {
        elements.push(
          <div key={lIdx} style={{ margin: '3px 0' }}>
            {renderInline(line)}
          </div>
        );
      }
    });

    if (inTable || tableRows.length > 0) {
      flushTable('end');
    }

    return <div key={pIdx}>{elements}</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {parts.map((p, i) => {
        if (p.type === 'code') {
          return (
            <div key={i} style={{
              margin: '10px 0',
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#090d16',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.06)',
                padding: '6px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: '#94a3b8',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}>
                <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.language}</span>
                <button
                  onClick={() => copyCode(p.code, p.index)}
                  style={{
                    background: copiedIndex === p.index ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    color: copiedIndex === p.index ? '#4ade80' : '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedIndex === p.index ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
              <pre style={{
                margin: 0,
                padding: '14px',
                overflowX: 'auto',
                fontSize: '0.88rem',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                color: '#f8fafc',
                lineHeight: '1.5'
              }}>
                <code>{p.code}</code>
              </pre>
            </div>
          );
        }
        return renderTextPart(p.content, i);
      })}
    </div>
  );
}

const LOCAL_FALLBACK_REPLIES = [
  {
    keywords: ['hi', 'hello', 'hey', 'namaste', 'namaskaram', 'నమస్కారం', 'హలో', 'హాయ్', 'ela unnav', 'how are you'],
    reply: "హలో! 🙏 నేను మీ AI అసిస్టెంట్ ని. ఈ రోజు మీకు ఎలా సహాయపడగలను?"
  },
  {
    keywords: ['joke', 'jokes', 'funny', 'నవ్వు', 'జోక్', 'comedy'],
    reply: "😂 ఒక చిన్న జోక్:\nటీచర్: 'బాబూ, సైన్స్ లో నీకు ఇష్టమైన సబ్జెక్ట్ ఏది?'\nస్టూడెంట్: 'రిసెస్ బెల్ టీచర్!' 🔔🤣"
  },
  {
    keywords: ['sametha', 'proverb', 'సామెత', 'quote', 'motivation'],
    reply: "📜 తెలుగు సామెత:\n'తీగ లాగితే డొంక కదిలినట్లు' - చిన్న విషయంతో పెద్ద విషయం బయటపడటం. 🌟"
  },
  {
    keywords: ['feature', 'features', 'app', 'help', 'call', 'video', 'story', 'stranger'],
    reply: "📱 Xorachat ఫీచర్లు:\n1. 💬 **Private Chat**: ఎండ్-టు-ఎండ్ ఎన్క్రిప్షన్‌తో చాటింగ్.\n2. 📞 **Audio & Video Calls**: హై క్వాలిటీ కాల్స్.\n3. 🕵️ **Stranger Chat**: అపరిచితులతో చాట్.\n4. 📺 **Stories**: స్టేటస్ వీడియోలు & ప్రొఫైల్ సాంగ్స్.\n5. 👥 **Groups**: స్నేహితులతో గ్రూప్స్!"
  }
];

function AiBotModal({ onClose }) {
  const { user, token } = useAuth();
  
  // AI Bot Language state (persisted in localStorage)
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const saved = localStorage.getItem('xorachat_ai_language');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = AI_LANGUAGES.find(l => l.id === parsed.id);
        if (match) return match;
      } catch (e) {}
    }
    return AI_LANGUAGES.find(l => l.id === 'te') || AI_LANGUAGES[0];
  });

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [langSearchQuery, setLangSearchQuery] = useState('');
  const [activeLangCategory, setActiveLangCategory] = useState('all');

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`ai_bot_msgs_${user?.id || 'guest'}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'welcome',
        sender: 'bot',
        text: `హలో ${user?.username ? user.username : ''}! 👋 నేను మీ **My AI** అసిస్టెంట్ ని. మీకు ఎలా సహాయపడగలను? ✨`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null); // { type, name, previewUrl, data (base64), mimeType, textContent }
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const videoRef = useRef(null);
  const attachMenuRef = useRef(null);

  // Filtered languages based on search query & category
  const filteredLanguages = useMemo(() => {
    const q = langSearchQuery.trim().toLowerCase();
    return AI_LANGUAGES.filter(lang => {
      const matchesCategory = 
        activeLangCategory === 'all' ||
        (activeLangCategory === 'indian' && (lang.category === 'Indian Regional & National' || lang.id === 'auto')) ||
        (activeLangCategory === 'international' && (lang.category === 'International' || lang.id === 'auto'));

      if (!matchesCategory) return false;

      if (!q) return true;
      return (
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.id.toLowerCase().includes(q) ||
        (lang.description && lang.description.toLowerCase().includes(q))
      );
    });
  }, [langSearchQuery, activeLangCategory]);

  const handleSelectLanguage = (lang) => {
    setSelectedLanguage(lang);
    localStorage.setItem('xorachat_ai_language', JSON.stringify(lang));
    setIsLangModalOpen(false);
    setLangSearchQuery('');

    // Send instant dynamic AI confirmation message in the selected language
    const confirmationMsg = {
      id: Date.now(),
      sender: 'bot',
      text: lang.greeting || `AI Language has been set to ${lang.name} (${lang.nativeName}).`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, confirmationMsg]);
  };

  useEffect(() => {
    localStorage.setItem(`ai_bot_msgs_${user?.id || 'guest'}`, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, user]);

  // Click outside to close attachment menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setIsAttachMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up camera stream when camera closes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraStream]);

  // Camera Open Handler
  const handleOpenCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Camera access could not be started. You can still upload images from your device.');
      setIsCameraOpen(false);
    }
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64Data = dataUrl.split(',')[1];

    setAttachment({
      type: 'image',
      name: `Photo_${Date.now()}.jpg`,
      previewUrl: dataUrl,
      data: base64Data,
      mimeType: 'image/jpeg'
    });

    handleCloseCamera();
  };

  // Image File Upload
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const base64Data = dataUrl.split(',')[1];
      setAttachment({
        type: 'image',
        name: file.name,
        previewUrl: dataUrl,
        data: base64Data,
        mimeType: file.type || 'image/jpeg',
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Document File Upload
  const handleDocFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isText = file.type.startsWith('text/') || file.name.match(/\.(txt|csv|json|js|py|cpp|java|html|css|md)$/i);

    if (isText) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const textContent = ev.target.result;
        setAttachment({
          type: 'document',
          name: file.name,
          previewUrl: null,
          textContent: textContent,
          mimeType: 'text/plain',
          size: (file.size / 1024).toFixed(1) + ' KB'
        });
      };
      reader.readAsText(file);
    } else {
      // PDF or binary doc
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const base64Data = dataUrl.split(',')[1];
        setAttachment({
          type: 'document',
          name: file.name,
          previewUrl: null,
          data: base64Data,
          mimeType: isPdf ? 'application/pdf' : 'application/octet-stream',
          size: (file.size / 1024).toFixed(1) + ' KB'
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if ((!query && !attachment) || isTyping) return;

    const currentAttachment = attachment;
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query || (currentAttachment ? `Analyzed attachment: ${currentAttachment.name}` : ''),
      attachment: currentAttachment ? {
        type: currentAttachment.type,
        name: currentAttachment.name,
        previewUrl: currentAttachment.previewUrl,
        size: currentAttachment.size
      } : null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setAttachment(null);
    setIsTyping(true);

    try {
      const historyContext = messages.filter(m => m.id !== 'welcome').slice(-8).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const payload = {
        message: query,
        history: historyContext,
        language: selectedLanguage
      };

      if (currentAttachment) {
        payload.attachment = {
          data: currentAttachment.data,
          mimeType: currentAttachment.mimeType,
          textContent: currentAttachment.textContent,
          fileName: currentAttachment.name
        };
      }

      const res = await axios.post('/api/ai/chat', payload, {
        headers: token ? { 'x-auth-token': token } : {}
      });

      const replyText = res.data?.reply || "నేను మీ సందేశాన్ని అర్థం చేసుకున్నాను! మరిన్ని ప్రశ్నలు అడగండి. 😊";
      const generatedImage = res.data?.generatedImage || null;
      const originalPrompt = res.data?.prompt || query;

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: replyText,
            generatedImage: generatedImage,
            imagePrompt: originalPrompt,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsTyping(false);
      }, 400);

    } catch (err) {
      const clean = query.toLowerCase();
      let matched = LOCAL_FALLBACK_REPLIES.find(r => r.keywords.some(k => clean.includes(k)));
      const replyText = matched ? matched.reply : "నమస్కారం! నేను మీ Xorachat AI బోట్ ని. మీతో మాట్లాడటం చాలా సంతోషంగా ఉంది! 🤖🌟";

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsTyping(false);
      }, 400);
    }
  };

  const handleRegeneratePhoto = async (msgId, imagePrompt) => {
    if (!imagePrompt) return;
    setIsTyping(true);
    try {
      const res = await axios.post('/api/ai/generate-image', { prompt: imagePrompt }, {
        headers: token ? { 'x-auth-token': token } : {}
      });
      const newImg = res.data?.imageUrl;
      if (newImg) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, generatedImage: newImg } : m));
      }
    } catch (e) {
      console.error('Failed to regenerate image:', e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    const welcome = [
      {
        id: 'welcome',
        sender: 'bot',
        text: `నమస్కారం! 🙏 చాట్ రీసెట్ చేయబడింది. ఏం మాట్లాడదాం? 🤖`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(welcome);
    localStorage.removeItem(`ai_bot_msgs_${user?.id || 'guest'}`);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        maxHeight: '100dvh',
        zIndex: 99999,
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Hidden file inputs */}
      <input 
        type="file" 
        ref={imageInputRef} 
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={handleImageFile} 
      />
      <input 
        type="file" 
        ref={docInputRef} 
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.py,.js,.html,.css,.md" 
        style={{ display: 'none' }} 
        onChange={handleDocFile} 
      />

      {/* Full Screen Top Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'white',
        flexShrink: 0,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            title="Back to Xorachat"
          >
            <ArrowLeft size={22} />
          </button>
          
          {/* Interactive Clickable AI Bot Avatar for Language Selection */}
          <div 
            onClick={() => setIsLangModalOpen(true)}
            style={{
              position: 'relative',
              cursor: 'pointer',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title="Click AI Logo to Change Language (తెలుగు, English, हिन्दी, etc.)"
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}>
              <Bot size={26} color="white" />
            </div>
            {/* Miniature Language Globe Badge */}
            <div style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              background: '#0284c7',
              border: '2px solid #1e1b4b',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
            }}>
              <Globe size={11} color="white" />
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>My AI Assistant</span>
              <Sparkles size={18} color="#fde047" />
              
              {/* Interactive Language Selector Chip */}
              <button
                onClick={() => setIsLangModalOpen(true)}
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.28)',
                  borderRadius: '16px',
                  padding: '3px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                title="Change AI Language"
              >
                <span>{selectedLanguage.flag}</span>
                <span>{selectedLanguage.name}</span>
                <span style={{ color: '#93c5fd', fontSize: '0.72rem' }}>({selectedLanguage.nativeName})</span>
                <ChevronDown size={12} color="#cbd5e1" />
              </button>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Vision • Documents • Image Gen • Math & Code
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsLangModalOpen(true)}
            style={{
              background: 'rgba(99, 102, 241, 0.25)',
              border: '1px solid rgba(129, 140, 248, 0.4)',
              borderRadius: '20px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'; }}
            title="Search and select AI language"
          >
            <Globe size={16} color="#38bdf8" />
            <span>Languages</span>
          </button>

          <button 
            onClick={handleClear}
            title="Clear Chat History"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </div>

      {/* Main Full-Screen Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 20px',
        background: '#0b1329',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flex: 1
        }}>
          {messages.map((m) => {
            const isBot = m.sender === 'bot';
            return (
              <div 
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: isBot ? 'flex-start' : 'flex-end',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                {isBot && (
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(99,102,241,0.3)',
                    marginTop: '2px'
                  }}>
                    <Bot size={20} />
                  </div>
                )}
                <div style={{
                  maxWidth: isBot ? '88%' : '75%',
                  padding: '14px 18px',
                  borderRadius: isBot ? '20px 20px 20px 6px' : '20px 20px 6px 20px',
                  background: isBot ? '#1e293b' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  boxShadow: isBot ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(99, 102, 241, 0.35)',
                  fontSize: '0.98rem',
                  lineHeight: '1.6',
                  position: 'relative',
                  border: isBot ? '1px solid rgba(255,255,255,0.06)' : 'none'
                }}>
                  {/* If user attached media */}
                  {m.attachment && (
                    <div style={{
                      marginBottom: '10px',
                      background: 'rgba(0,0,0,0.25)',
                      padding: '8px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      {m.attachment.type === 'image' && m.attachment.previewUrl ? (
                        <img 
                          src={m.attachment.previewUrl} 
                          alt="User upload" 
                          onClick={() => setPreviewModalImg(m.attachment.previewUrl)}
                          style={{
                            width: '80px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }} 
                        />
                      ) : (
                        <div style={{ padding: '8px 12px', background: '#3b82f6', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                          📄 DOC
                        </div>
                      )}
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600 }}>{m.attachment.name}</div>
                        {m.attachment.size && <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{m.attachment.size}</div>}
                      </div>
                    </div>
                  )}

                  <FormattedAiMessage content={m.text} isBot={isBot} />

                  {/* AI Generated Image Card */}
                  {m.generatedImage && (
                    <div style={{
                      marginTop: '14px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#090d16',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}>
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <img 
                          src={m.generatedImage} 
                          alt="AI Generated Art" 
                          onClick={() => setPreviewModalImg(m.generatedImage)}
                          style={{
                            width: '100%',
                            maxHeight: '420px',
                            objectFit: 'cover',
                            display: 'block',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease'
                          }}
                        />
                      </div>
                      <div style={{
                        padding: '10px 14px',
                        background: 'rgba(15, 23, 42, 0.95)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '0.82rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          📸 Ultra-HD Real Photo
                        </span>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleRegeneratePhoto(m.id, m.imagePrompt || m.text)}
                            title="Generate another real photo shot"
                            style={{
                              background: 'rgba(99, 102, 241, 0.2)',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              color: '#a5b4fc',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.35)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; }}
                          >
                            🔄 New Shot
                          </button>
                          <button
                            onClick={() => setPreviewModalImg(m.generatedImage)}
                            style={{
                              background: 'rgba(255,255,255,0.1)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              color: '#ffffff',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            🔍 Full View
                          </button>
                          <a
                            href={m.generatedImage}
                            download="AI_Real_Photo.jpg"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 12px',
                              color: '#ffffff',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            ⬇ Download
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{
                    fontSize: '0.72rem',
                    textAlign: 'right',
                    marginTop: '8px',
                    color: isBot ? '#94a3b8' : 'rgba(255,255,255,0.75)'
                  }}>
                    {m.time}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Bot size={20} />
              </div>
              <div style={{ background: '#1e293b', padding: '12px 20px', borderRadius: '20px 20px 20px 6px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ width: '8px', height: '8px', background: '#818cf8', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1', marginLeft: '6px' }}>AI is thinking & analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Live Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 100001,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            borderRadius: '16px',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '560px',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.7)'
          }}>
            <div style={{
              padding: '12px 18px',
              background: '#1e293b',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700
            }}>
              <span>📷 Capture Photo for AI</span>
              <button 
                onClick={handleCloseCamera}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ background: 'black', position: 'relative', width: '100%', minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>
            <div style={{
              padding: '16px',
              background: '#1e293b',
              display: 'flex',
              justifyContent: 'center',
              gap: '16px'
            }}>
              <button
                onClick={handleCloseCamera}
                style={{
                  padding: '10px 20px',
                  borderRadius: '24px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCapturePhoto}
                style={{
                  padding: '10px 24px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.5)'
                }}
              >
                📸 Capture & Use
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Image Viewer */}
      {previewModalImg && (
        <div 
          onClick={() => setPreviewModalImg(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 100002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <button 
            onClick={() => setPreviewModalImg(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
          <img 
            src={previewModalImg} 
            alt="Preview" 
            style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }} 
          />
        </div>
      )}

      {/* Pinned Bottom Input Bar & Multimodal Controls */}
      <div style={{
        padding: '10px 14px max(12px, env(safe-area-inset-bottom, 12px)) 14px',
        background: '#1e293b',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Attachment Preview Box (if selected) */}
          {attachment && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '12px',
              padding: '8px 14px',
              animation: 'fadeIn 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {attachment.type === 'image' && attachment.previewUrl ? (
                  <img 
                    src={attachment.previewUrl} 
                    alt="Preview" 
                    style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ padding: '8px 12px', background: '#4338ca', borderRadius: '6px', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                    📄 DOC
                  </div>
                )}
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.88rem' }}>{attachment.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    {attachment.type === 'image' ? '🖼️ Image Ready for AI analysis' : '📄 Document Ready for AI analysis'} ({attachment.size || 'Ready'})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAttachment(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Remove attachment"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Main Input Row with Plus (+) button and Dropdown Action Menu */}
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* Plus (+) Action Button & Floating Menu */}
            <div style={{ position: 'relative' }} ref={attachMenuRef}>
              <button
                type="button"
                onClick={() => setIsAttachMenuOpen(prev => !prev)}
                title="Upload Photo, Document or Camera"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: isAttachMenuOpen 
                    ? 'linear-gradient(135deg, #6366f1, #a855f7)' 
                    : 'rgba(255,255,255,0.08)',
                  border: isAttachMenuOpen ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.18)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isAttachMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  boxShadow: isAttachMenuOpen ? '0 4px 18px rgba(99,102,241,0.55)' : 'none',
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  if (!isAttachMenuOpen) {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.25)';
                    e.currentTarget.style.borderColor = '#818cf8';
                  }
                }}
                onMouseLeave={e => {
                  if (!isAttachMenuOpen) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                  }
                }}
              >
                <Plus size={22} strokeWidth={2.5} />
              </button>

              {/* Floating Listwise Actions Popup Menu */}
              {isAttachMenuOpen && (
                <div style={{
                  position: 'absolute',
                  bottom: '58px',
                  left: 0,
                  background: 'rgba(15, 23, 42, 0.96)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: '16px',
                  padding: '8px',
                  width: '270px',
                  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.75), 0 0 1px 1px rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 1000,
                  animation: 'fadeInUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  {/* 1. Camera / Take Photo */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      handleOpenCamera();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8'
                    }}>
                      <Camera size={19} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Camera / Take Photo</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Capture math, notes, objects</div>
                    </div>
                  </button>

                  {/* 2. Upload Image */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      imageInputRef.current?.click();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(74, 222, 128, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4ade80'
                    }}>
                      <Image size={19} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Upload Image</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Photos, diagrams, screenshots</div>
                    </div>
                  </button>

                  {/* 3. Upload Document */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      docInputRef.current?.click();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#c084fc'
                    }}>
                      <FileText size={19} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Upload Document</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PDF, TXT, CSV, Code files</div>
                    </div>
                  </button>

                  {/* 4. Generate AI Image */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      setInput('Generate an image of ');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fbbf24'
                    }}>
                      <Sparkles size={19} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Generate AI Image</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Create art & graphics from text</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <input 
              type="text"
              placeholder={attachment ? "Add instructions for this file (or press Send)..." : "Ask anything, solve math/code, generate image..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
              style={{
                flex: 1,
                padding: '13px 20px',
                borderRadius: '28px',
                border: '1px solid rgba(255,255,255,0.15)',
                outline: 'none',
                fontSize: '0.98rem',
                background: '#0f172a',
                color: '#ffffff',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !attachment) || isTyping}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: (input.trim() || attachment) && !isTyping ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.1)',
                color: (input.trim() || attachment) && !isTyping ? 'white' : '#64748b',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (input.trim() || attachment) && !isTyping ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                boxShadow: (input.trim() || attachment) && !isTyping ? '0 4px 14px rgba(99,102,241,0.45)' : 'none',
                flexShrink: 0
              }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* AI Bot Language Selector Modal Overlay */}
      {isLangModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(5, 10, 25, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setIsLangModalOpen(false)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.25)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                }}>
                  <Languages size={22} color="white" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                    Select AI Bot Language
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                    Choose any Indian regional, national, or international language
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLangModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar & Category Filters */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search language (e.g., Telugu, Hindi, Tamil, English, etc.)..."
                  value={langSearchQuery}
                  onChange={e => setLangSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '14px',
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.25)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {langSearchQuery && (
                  <button
                    onClick={() => setLangSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                  { id: 'all', label: `All Languages (${AI_LANGUAGES.length})` },
                  { id: 'indian', label: '🇮🇳 Indian Regional & National' },
                  { id: 'international', label: '🌍 International Languages' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveLangCategory(cat.id)}
                    style={{
                      background: activeLangCategory === cat.id ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.08)',
                      border: activeLangCategory === cat.id ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
                      color: activeLangCategory === cat.id ? '#ffffff' : '#cbd5e1',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Grid */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              {filteredLanguages.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <Search size={36} color="#64748b" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>No languages matched "{langSearchQuery}"</p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>Try searching by English or native script name (e.g., Telugu, தமிழ், Hindi)</p>
                </div>
              ) : (
                filteredLanguages.map(lang => {
                  const isSelected = selectedLanguage?.id === lang.id;
                  return (
                    <div
                      key={lang.id}
                      onClick={() => handleSelectLanguage(lang)}
                      style={{
                        background: isSelected 
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)' 
                          : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1.5px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isSelected ? '0 4px 20px rgba(99, 102, 241, 0.3)' : 'none'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{lang.flag}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.98rem', color: isSelected ? '#ffffff' : '#f1f5f9' }}>
                              {lang.name}
                            </span>
                            <span style={{ 
                              fontSize: '0.85rem', 
                              color: isSelected ? '#a5b4fc' : '#94a3b8',
                              fontWeight: 600,
                              background: 'rgba(255,255,255,0.06)',
                              padding: '2px 8px',
                              borderRadius: '8px'
                            }}>
                              {lang.nativeName}
                            </span>
                          </div>
                          {lang.description && (
                            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {lang.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected ? (
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#6366f1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Check size={15} color="white" strokeWidth={3} />
                        </div>
                      ) : (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: '1.5px solid rgba(255,255,255,0.2)',
                          flexShrink: 0
                        }} />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Selected: <strong style={{ color: '#e0e7ff' }}>{selectedLanguage?.flag} {selectedLanguage?.name} ({selectedLanguage?.nativeName})</strong>
              </span>
              <button
                onClick={() => setIsLangModalOpen(false)}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 18px',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiBotModal;
