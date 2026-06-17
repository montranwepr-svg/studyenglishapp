import { LessonNode, VocabularyItem, AICharacter } from "./types";

export const AI_CHARACTERS: AICharacter[] = [
  {
    id: "sophia",
    name: "Sophia",
    role: "Giáo viên tiếng Anh bản ngữ",
    description: "Ấm áp, kiên nhẫn, nói chậm rãi, chuyên gia sửa lỗi phát âm và ngữ pháp.",
    avatar: "bg-emerald-500",
    accent: "us",
    greeting: "Hello there! I'm Sophia, your English teacher. Let's practice speaking today! How are you feeling?"
  },
  {
    id: "john",
    name: "John",
    role: "Người pha cà phê (New York Barista)",
    description: "Thân thiện, trẻ trung, dùng tiếng Anh giao tiếp đời thường và tiếng lóng Mỹ.",
    avatar: "bg-amber-500",
    accent: "us",
    greeting: "Yo! Welcome to New York Cafe. What can I get for you today, or do you just want to hang out and talk?"
  },
  {
    id: "emma",
    name: "Emma",
    role: "Hướng dẫn viên du lịch London",
    description: "Năng động, hào hứng, giọng Anh-Anh thanh lịch, chuyên kể về các chuyến đi.",
    avatar: "bg-cyan-500",
    accent: "uk",
    greeting: "Cheerio! I'm Emma, your virtual London tour guide. Shall we start exploring the beautiful sights together?"
  },
  {
    id: "james",
    name: "Dr. James",
    role: "Người phỏng vấn tuyển dụng",
    description: "Lịch lãm, chuyên nghiệp, phỏng vấn tiếng Anh thương mại và định hướng nghề nghiệp.",
    avatar: "bg-indigo-500",
    accent: "us",
    greeting: "Good day. I am Dr. James. Welcome to our mock interview process. Tell me, why do you wish to join our company?"
  }
];

export const CORE_VOCABULARY: VocabularyItem[] = [
  // Beginner
  {
    id: "beg_1",
    word: "Hello",
    pronunciation: "/həˈloʊ/",
    meaningVi: "Xin chào",
    exampleEn: "Hello! Nice to meet you today.",
    exampleVi: "Xin chào! Rất vui được gặp bạn hôm nay.",
    level: "beginner",
    category: "Giao tiếp"
  },
  {
    id: "beg_2",
    word: "Family",
    pronunciation: "/ˈfæm.əl.i/",
    meaningVi: "Gia đình",
    exampleEn: "I love spending my weekends with my family.",
    exampleVi: "Tôi thích dành những ngày cuối tuần của mình với gia đình.",
    level: "beginner",
    category: "Gia đình"
  },
  {
    id: "beg_3",
    word: "Delicious",
    pronunciation: "/dɪˈlɪʃ.əs/",
    meaningVi: "Ngon miệng",
    exampleEn: "This bowl of Pho is absolutely delicious!",
    exampleVi: "Tô phở này thực sự rất ngon miệng!",
    level: "beginner",
    category: "Ăn uống"
  },
  {
    id: "beg_4",
    word: "Sunny",
    pronunciation: "/ˈsʌn.i/",
    meaningVi: "Nắng ráo, đầy nắng",
    exampleEn: "It is a beautiful sunny Sunday in London.",
    exampleVi: "Hôm nay là một ngày Chủ nhật đầy nắng đẹp trời ở Luân Đôn.",
    level: "beginner",
    category: "Thời tiết"
  },
  {
    id: "beg_5",
    word: "Book",
    pronunciation: "/bʊk/",
    meaningVi: "Sách / Đặt trước",
    exampleEn: "I am reading an interesting book about science.",
    exampleVi: "Tôi đang đọc một cuốn sách thú vị về khoa học.",
    level: "beginner",
    category: "Đời sống"
  },

  // Intermediate
  {
    id: "int_1",
    word: "Destination",
    pronunciation: "/ˌdes.təˈneɪ.ʃən/",
    meaningVi: "Điểm đến",
    exampleEn: "Da Nang is a very popular tourist destination in Vietnam.",
    exampleVi: "Đà Nẵng là một điểm đến du lịch rất phổ biến ở Việt Nam.",
    level: "intermediate",
    category: "Du lịch"
  },
  {
    id: "int_2",
    word: "Innovation",
    pronunciation: "/ˌɪn.əˈveɪ.ʃən/",
    meaningVi: "Sự đổi mới, sáng chế",
    exampleEn: "Technology innovation drives fast business growth.",
    exampleVi: "Sự đổi mới công nghệ thúc đẩy sự tăng trưởng nhanh chóng của doanh nghiệp.",
    level: "intermediate",
    category: "Công nghệ"
  },
  {
    id: "int_3",
    word: "Environment",
    pronunciation: "/ɪnˈvaɪ.rən.mənt/",
    meaningVi: "Môi trường",
    exampleEn: "We must act together to protect our environment.",
    exampleVi: "Chúng ta phải cùng nhau hành động để bảo vệ môi trường.",
    level: "intermediate",
    category: "Sức khỏe"
  },
  {
    id: "int_4",
    word: "Collaborate",
    pronunciation: "/kəˈlæb.ə.reɪt/",
    meaningVi: "Hợp tác",
    exampleEn: "Our team will collaborate with engineers on this project.",
    exampleVi: "Đội ngũ của chúng tôi sẽ hợp tác với các kỹ sư trong dự án này.",
    level: "intermediate",
    category: "Công việc"
  },

  // Advanced
  {
    id: "adv_1",
    word: "Fluctuation",
    pronunciation: "/ˌflʌk.tʃuˈeɪ.ʃən/",
    meaningVi: "Sự biến động",
    exampleEn: "The extreme fluctuation of stock prices made investors worried.",
    exampleVi: "Sự biến động dữ dội của giá cổ phiếu khiến các nhà đầu tư lo lắng.",
    level: "advanced",
    category: "Kinh tế"
  },
  {
    id: "adv_2",
    word: "Hypothesis",
    pronunciation: "/haɪˈpɑː.θə.sɪs/",
    meaningVi: "Giả thuyết",
    exampleEn: "The scientists tested their research hypothesis in the lab.",
    exampleVi: "Các nhà khoa học đã thử nghiệm giả thuyết nghiên cứu của họ trong phòng thí nghiệm.",
    level: "advanced",
    category: "Khoa học"
  },
  {
    id: "adv_3",
    word: "Sovereignty",
    pronunciation: "/ˈsɑːv.rən.ti/",
    meaningVi: "Chủ quyền",
    exampleEn: "Respecting national sovereignty is a core principle of international law.",
    exampleVi: "Tôn trọng chủ quyền quốc gia là nguyên tắc cốt lõi của luật pháp quốc tế.",
    level: "advanced",
    category: "Chính trị"
  },
  {
    id: "adv_4",
    word: "Existential",
    pronunciation: "/ˌeɡ.zɪˈsten.ʃəl/",
    meaningVi: "Thuộc về sự hiện sinh",
    exampleEn: "Climate change presents an existential threat to humanity.",
    exampleVi: "Biến đổi khí hậu đặt ra một mối đe dọa hiện sinh đối với nhân loại.",
    level: "advanced",
    category: "Triết học"
  }
];

export const CORE_LESSONS: LessonNode[] = [
  // BEGINNER ROADMAP
  {
    id: "lesson_beg_1",
    title: "Chào hỏi & Làm quen (Greetings)",
    description: "Học cách tự giới thiệu bản thân và chào hỏi người bản xứ.",
    level: "beginner",
    vocabularyIds: ["beg_1", "beg_2"],
    quizzes: [
      {
        id: "q_beg_1_1",
        type: "multiple-choice",
        question: "Từ nào có nghĩa là 'Xin chào'?",
        options: ["Hello", "Goodbye", "Thank you", "Sorry"],
        correctAnswer: "Hello"
      },
      {
        id: "q_beg_1_2",
        type: "spelling",
        question: "Điền chữ cái thiếu để hoàn thành từ 'gia đình': F_m_ly",
        correctAnswer: "a_i",
        hint: "Gợi ý: F_m_ly. Nhập chữ cái điền vào chỗ trống theo dạng 'a_i' (hoặc 'ai'). Nhập đáp án đúng: 'a_i' hoặc viết hẳn 'family'."
      }
    ]
  },
  {
    id: "lesson_beg_2",
    title: "Ẩm thực & Thời tiết (Food & Weather)",
    description: "Cách bình luận về một món ăn ngon và mô tả thời tiết ngoài trời.",
    level: "beginner",
    vocabularyIds: ["beg_3", "beg_4"],
    quizzes: [
      {
        id: "q_beg_2_1",
        type: "translation",
        question: "Dịch từ sau sang tiếng Anh: 'Ngon miệng'",
        correctAnswer: "Delicious"
      },
      {
        id: "q_beg_2_2",
        type: "multiple-choice",
        question: "Trời đầy nắng tiếng Anh nói thế nào?",
        options: ["Rainy", "Sunny", "Cloudy", "Snowy"],
        correctAnswer: "Sunny"
      }
    ]
  },

  // INTERMEDIATE ROADMAP
  {
    id: "lesson_int_1",
    title: "Khám phá Du lịch (Travel & Explore)",
    description: "Thực hành hỏi thăm phương hướng và trình bày về điểm đến yêu thích.",
    level: "intermediate",
    vocabularyIds: ["int_1", "int_2"],
    quizzes: [
      {
        id: "q_int_1_1",
        type: "multiple-choice",
        question: "What is the synonym of 'travel spot / target location' representing where you are going?",
        options: ["Departure", "Destination", "Innovation", "Collaboration"],
        correctAnswer: "Destination"
      },
      {
        id: "q_int_1_2",
        type: "translation",
        question: "Từ 'Innovation' trong tiếng Việt có nghĩa là gì?",
        correctAnswer: "Sự đổi mới"
      }
    ]
  },
  {
    id: "lesson_int_2",
    title: "Môi trường & Công việc (Environment & Workplace)",
    description: "Thảo luận về các giải pháp bảo vệ môi trường và hợp tác nhóm tại công ty.",
    level: "intermediate",
    vocabularyIds: ["int_3", "int_4"],
    quizzes: [
      {
        id: "q_int_2_1",
        type: "multiple-choice",
        question: "Từ nào có nghĩa là 'Hợp tác'?",
        options: ["Collaborate", "Compete", "Isolate", "Inhibit"],
        correctAnswer: "Collaborate"
      },
      {
        id: "q_int_2_2",
        type: "spelling",
        question: "Hoàn chỉnh từ chỉ 'môi trường': E_v_r_n_e_t. Nhập đúng từ tiếng Anh này.",
        correctAnswer: "environment"
      }
    ]
  },

  // ADVANCED ROADMAP
  {
    id: "lesson_adv_1",
    title: "Kinh tế học & Nghiên cứu (Economics & Hypothesis)",
    description: "Phân tích biến động tài chính toàn cầu và xây dựng giả thuyết khoa học.",
    level: "advanced",
    vocabularyIds: ["adv_1", "adv_2"],
    quizzes: [
      {
        id: "q_adv_1_1",
        type: "multiple-choice",
        question: "What refers to an idea or explanation that you testing through study and experimentation?",
        options: ["Fact", "Result", "Opinion", "Hypothesis"],
        correctAnswer: "Hypothesis"
      },
      {
        id: "q_adv_1_2",
        type: "translation",
        question: "Dịch từ sau sang tiếng Anh: 'Sự biến động'",
        correctAnswer: "Fluctuation"
      }
    ]
  },
  {
    id: "lesson_adv_2",
    title: "Chủ quyền & Trết học Hiện sinh (Sovereignty & Philosophy)",
    description: "Thảo luận mang tính học thuật về quốc phòng, biên giới lãnh thổ và triết học hiện sinh.",
    level: "advanced",
    vocabularyIds: ["adv_3", "adv_4"],
    quizzes: [
      {
        id: "q_adv_2_1",
        type: "multiple-choice",
        question: "Which word represents 'the authority of a state to govern itself or another state'?",
        options: ["Sovereignty", "Submission", "Surrender", "Servitude"],
        correctAnswer: "Sovereignty"
      },
      {
        id: "q_adv_2_2",
        type: "translation",
        question: "'Existential' means relating to what in Vietnamese?",
        correctAnswer: "Sự hiện sinh"
      }
    ]
  }
];
