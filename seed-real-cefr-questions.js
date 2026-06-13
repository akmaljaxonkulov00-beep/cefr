const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

// ====================================
// REAL CEFR SPEAKING QUESTIONS
// Based on Cambridge B1-C1 exam formats
// ====================================

const speakingQuestions = [
  // ============ PART 1: Interview Questions (50 total) ============
  // Personal Information & Daily Life (10)
  { part: 1, level: 'B1', question: 'Tell me about your family. Who do you live with?', time: 30 },
  { part: 1, level: 'B1', question: 'What do you usually do on weekends?', time: 30 },
  { part: 1, level: 'B1', question: 'Can you describe your typical day?', time: 30 },
  { part: 1, level: 'A2', question: 'What time do you usually wake up?', time: 30 },
  { part: 1, level: 'B1', question: 'Do you prefer mornings or evenings? Why?', time: 30 },
  { part: 1, level: 'B1', question: 'How do you usually get to work or school?', time: 30 },
  { part: 1, level: 'A2', question: 'What is your favorite day of the week? Why?', time: 30 },
  { part: 1, level: 'B1', question: 'Do you have any brothers or sisters? Tell me about them.', time: 30 },
  { part: 1, level: 'B1', question: 'What kind of food do you like eating?', time: 30 },
  { part: 1, level: 'B2', question: 'How has your daily routine changed in recent years?', time: 30 },

  // Hometown & Living (10)
  { part: 1, level: 'B1', question: 'Where are you from? Can you describe your hometown?', time: 30 },
  { part: 1, level: 'B2', question: 'What do you like most about living in your city?', time: 30 },
  { part: 1, level: 'B1', question: 'Is your hometown a good place for young people? Why?', time: 30 },
  { part: 1, level: 'B2', question: 'How has your hometown changed since you were a child?', time: 30 },
  { part: 1, level: 'B1', question: 'Would you prefer to live in a city or the countryside?', time: 30 },
  { part: 1, level: 'B2', question: 'What facilities does your neighborhood have?', time: 30 },
  { part: 1, level: 'B1', question: 'Do you know your neighbors well?', time: 30 },
  { part: 1, level: 'B2', question: 'What improvements would you like to see in your area?', time: 30 },
  { part: 1, level: 'A2', question: 'Do you live in a house or an apartment?', time: 30 },
  { part: 1, level: 'B1', question: 'What is the best thing about where you live?', time: 30 },

  // Hobbies & Free Time (10)
  { part: 1, level: 'B1', question: 'What do you enjoy doing in your free time?', time: 30 },
  { part: 1, level: 'B2', question: 'Have your hobbies changed since you were younger?', time: 30 },
  { part: 1, level: 'B1', question: 'Do you prefer indoor or outdoor activities? Why?', time: 30 },
  { part: 1, level: 'B2', question: 'How important is it to have hobbies? Why?', time: 30 },
  { part: 1, level: 'A2', question: 'What sport do you like watching?', time: 30 },
  { part: 1, level: 'B1', question: 'Do you play any musical instruments?', time: 30 },
  { part: 1, level: 'B2', question: 'Would you like to try any new hobbies in the future?', time: 30 },
  { part: 1, level: 'B1', question: 'How much time do you spend on your hobbies each week?', time: 30 },
  { part: 1, level: 'B2', question: 'Do you think people have enough free time these days?', time: 30 },
  { part: 1, level: 'B1', question: 'What do you usually do to relax?', time: 30 },

  // Work & Study (10)
  { part: 1, level: 'B1', question: 'What do you do? Do you work or are you a student?', time: 30 },
  { part: 1, level: 'B2', question: 'What do you enjoy most about your job or studies?', time: 30 },
  { part: 1, level: 'B1', question: 'What subject did you enjoy most at school?', time: 30 },
  { part: 1, level: 'B2', question: 'Why did you choose your current job or course?', time: 30 },
  { part: 1, level: 'B1', question: 'What are your plans for the future?', time: 30 },
  { part: 1, level: 'B2', question: 'How do you think your work will change in the next few years?', time: 30 },
  { part: 1, level: 'B1', question: 'Do you work better in the morning or afternoon?', time: 30 },
  { part: 1, level: 'C1', question: 'What skills do you think are most important for your career?', time: 30 },
  { part: 1, level: 'B2', question: 'Would you like to change your job in the future? Why?', time: 30 },
  { part: 1, level: 'B1', question: 'How do you usually travel to work or university?', time: 30 },

  // Technology & Media (10)
  { part: 1, level: 'B1', question: 'How often do you use the internet?', time: 30 },
  { part: 1, level: 'B2', question: 'What do you mainly use your phone for?', time: 30 },
  { part: 1, level: 'B2', question: 'Do you prefer reading news online or in newspapers?', time: 30 },
  { part: 1, level: 'C1', question: 'How has technology changed the way people communicate?', time: 30 },
  { part: 1, level: 'B1', question: 'What is your favorite website or app?', time: 30 },
  { part: 1, level: 'B2', question: 'Do you think people spend too much time on social media?', time: 30 },
  { part: 1, level: 'B1', question: 'What kind of TV programmes do you like watching?', time: 30 },
  { part: 1, level: 'B2', question: 'Do you prefer watching films at home or at the cinema?', time: 30 },
  { part: 1, level: 'C1', question: 'How do you think technology will change education?', time: 30 },
  { part: 1, level: 'B1', question: 'What was the last film you watched?', time: 30 },

  // ============ PART 2: Long Turn / Monologue (20 total) ============
  // Topic card format with cue points
  { part: 2, level: 'B1', question: 'Describe a place you have visited that you really enjoyed.\n\nYou should say:\n- where it was\n- when you went there\n- what you did there\n- and explain why you enjoyed it', time: 60 },
  { part: 2, level: 'B2', question: 'Describe a memorable event from your childhood.\n\nYou should say:\n- what the event was\n- when and where it happened\n- who was with you\n- and explain why it was memorable', time: 60 },
  { part: 2, level: 'B2', question: 'Describe a person who has influenced you.\n\nYou should say:\n- who this person is\n- how you know them\n- what they have done\n- and explain how they influenced you', time: 60 },
  { part: 2, level: 'C1', question: 'Describe a difficult decision you had to make.\n\nYou should say:\n- what the decision was about\n- when you had to make it\n- what factors you considered\n- and explain what the outcome was', time: 60 },
  { part: 2, level: 'B1', question: 'Describe your favorite hobby or pastime.\n\nYou should say:\n- what it is\n- when you started doing it\n- how often you do it\n- and explain why you enjoy it', time: 60 },
  { part: 2, level: 'B2', question: 'Describe a book or film that made a strong impression on you.\n\nYou should say:\n- what it was about\n- when you read or watched it\n- what impressed you about it\n- and explain why you remember it', time: 60 },
  { part: 2, level: 'C1', question: 'Describe a challenge you have overcome.\n\nYou should say:\n- what the challenge was\n- why it was difficult for you\n- how you dealt with it\n- and explain what you learned from the experience', time: 60 },
  { part: 2, level: 'B1', question: 'Describe your best friend.\n\nYou should say:\n- who they are\n- how you met\n- what you do together\n- and explain why they are your best friend', time: 60 },
  { part: 2, level: 'B2', question: 'Describe a special celebration or festival in your country.\n\nYou should say:\n- what the celebration is\n- when it takes place\n- what people do during it\n- and explain why it is special', time: 60 },
  { part: 2, level: 'B2', question: 'Describe a goal you achieved.\n\nYou should say:\n- what the goal was\n- how long it took to achieve\n- what you did to achieve it\n- and explain how you felt when you achieved it', time: 60 },
  { part: 2, level: 'B1', question: 'Describe a teacher who helped you.\n\nYou should say:\n- who the teacher was\n- what subject they taught\n- how they helped you\n- and explain why you remember them', time: 60 },
  { part: 2, level: 'B2', question: 'Describe a time when you tried something new.\n\nYou should say:\n- what you tried\n- when and where you did it\n- how you felt about it\n- and explain whether you would do it again', time: 60 },
  { part: 2, level: 'C1', question: 'Describe a project or piece of work you are proud of.\n\nYou should say:\n- what the project was\n- who you worked with (if anyone)\n- what your role was\n- and explain why you are proud of it', time: 60 },
  { part: 2, level: 'B1', question: 'Describe a gift you received that was special to you.\n\nYou should say:\n- what the gift was\n- who gave it to you\n- when you received it\n- and explain why it was special', time: 60 },
  { part: 2, level: 'B2', question: 'Describe a time when you helped someone.\n\nYou should say:\n- who you helped\n- what the situation was\n- how you helped them\n- and explain how you felt about helping', time: 60 },
  { part: 2, level: 'B1', question: 'Describe a restaurant or café you like.\n\nYou should say:\n- where it is\n- what kind of food they serve\n- how often you go there\n- and explain why you like it', time: 60 },
  { part: 2, level: 'B2', question: 'Describe a skill you would like to learn.\n\nYou should say:\n- what the skill is\n- why you want to learn it\n- how you plan to learn it\n- and explain how it would benefit you', time: 60 },
  { part: 2, level: 'C1', question: 'Describe a time when something did not go as planned.\n\nYou should say:\n- what you were trying to do\n- what went wrong\n- how you dealt with the situation\n- and explain what you learned from it', time: 60 },
  { part: 2, level: 'B2', question: 'Describe a piece of advice someone gave you.\n\nYou should say:\n- who gave you the advice\n- what the advice was\n- when they gave it to you\n- and explain whether you followed it and why', time: 60 },
  { part: 2, level: 'B1', question: 'Describe a journey you remember well.\n\nYou should say:\n- where you went\n- how you traveled\n- who you went with\n- and explain why you remember it', time: 60 },

  // ============ PART 3: Discussion Questions (20 total) ============
  // Abstract and analytical questions
  { part: 3, level: 'B2', question: 'Do you think social media has a positive or negative effect on society? Why?', time: 90 },
  { part: 3, level: 'C1', question: 'How important is it for countries to preserve their cultural heritage? Explain your view.', time: 90 },
  { part: 3, level: 'B2', question: 'What role should governments play in protecting the environment?', time: 90 },
  { part: 3, level: 'C1', question: 'Do you believe technology is making people more or less connected? Explain your reasoning.', time: 90 },
  { part: 3, level: 'B2', question: 'Is it better to work for a large company or a small company? Discuss the advantages of each.', time: 90 },
  { part: 3, level: 'C1', question: 'How has globalization affected local cultures around the world?', time: 90 },
  { part: 3, level: 'B1', question: 'Do you think it is important for children to learn about other cultures? Why or why not?', time: 90 },
  { part: 3, level: 'B2', question: 'What are the advantages and disadvantages of online shopping compared to traditional shopping?', time: 90 },
  { part: 3, level: 'C1', question: 'Should higher education be free for everyone? Discuss both sides of the argument.', time: 90 },
  { part: 3, level: 'C1', question: 'How can cities be designed to be more environmentally friendly?', time: 90 },
  { part: 3, level: 'B2', question: 'Do you think children spend too much time on electronic devices these days? Why?', time: 90 },
  { part: 3, level: 'B2', question: 'What are the main benefits of traveling to other countries?', time: 90 },
  { part: 3, level: 'C1', question: 'In what ways has the internet changed how people conduct business?', time: 90 },
  { part: 3, level: 'B2', question: 'Are people today healthier than people in the past? Explain your view.', time: 90 },
  { part: 3, level: 'C1', question: 'What impact does advertising have on consumer behavior? Give examples.', time: 90 },
  { part: 3, level: 'B2', question: 'Should schools focus more on practical skills or academic knowledge? Why?', time: 90 },
  { part: 3, level: 'C1', question: 'How has remote working changed the traditional workplace? What are the implications?', time: 90 },
  { part: 3, level: 'B2', question: 'Do you think celebrities have a responsibility to be good role models? Why?', time: 90 },
  { part: 3, level: 'C1', question: 'What measures can individuals take to reduce their environmental impact?', time: 90 },
  { part: 3, level: 'B2', question: 'Is learning a foreign language still important in the modern world? Explain your opinion.', time: 90 },
];

// ====================================
// REAL CEFR WRITING QUESTIONS
// Based on Cambridge B1-C1 formats
// ====================================

const writingQuestions = [
  // ============ TASK 1: Emails & Letters (30 total) ============
  // Informal Emails (10)
  { task: 1, level: 'B1', prompt: 'You recently moved to a new city. Write an email to your friend telling them about your new home and your first impressions of the area.\n\nWrite at least 120 words.', minWords: 120, maxWords: 150 },
  { task: 1, level: 'B1', prompt: 'Write an email to your pen pal describing a recent holiday or trip you took. Include what you did and what you enjoyed most about it.\n\nWrite at least 120 words.', minWords: 120, maxWords: 150 },
  { task: 1, level: 'A2', prompt: 'Write an email to your friend inviting them to your birthday party. Include the date, time, and location, and what you plan to do.\n\nWrite at least 100 words.', minWords: 100, maxWords: 120 },
  { task: 1, level: 'B1', prompt: 'Write a message to your language teacher thanking them for their help this term and describing what you have learned.\n\nWrite at least 120 words.', minWords: 120, maxWords: 150 },
  { task: 1, level: 'B1', prompt: 'You are planning a class reunion. Write an email to your former classmates with details about the event and asking them to confirm if they can attend.\n\nWrite at least 120 words.', minWords: 120, maxWords: 150 },
  { task: 1, level: 'B2', prompt: 'Write an email to your friend who is visiting your country for the first time. Give them advice about places to visit and things to do.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },
  { task: 1, level: 'A2', prompt: 'Write about your typical weekend routine. Describe what you usually do on Saturdays and Sundays.\n\nWrite at least 100 words.', minWords: 100, maxWords: 120 },
  { task: 1, level: 'B1', prompt: 'Write an email to your classmate asking for the notes from a lesson you missed. Explain why you were absent and what you need.\n\nWrite at least 120 words.', minWords: 120, maxWords: 150 },
  { task: 1, level: 'B1', prompt: 'Write a letter to your friend describing your new job or course. Explain what you do and what you like about it.\n\nWrite at least 120 words.', minWords: 120, maxWords: 150 },
  { task: 1, level: 'B2', prompt: 'You recently attended a concert or sports event. Write an email to your friend describing the experience and whether you would recommend it.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },

  // Formal Emails & Letters (10)
  { task: 1, level: 'B2', prompt: 'You are organizing a team-building event for your company. Write an email to your colleagues explaining the details of the event (date, time, location, activities).\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },
  { task: 1, level: 'B2', prompt: 'You missed an important meeting at work. Write an email to your supervisor apologizing and explaining why you could not attend.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },
  { task: 1, level: 'C1', prompt: 'Write a formal letter to a company requesting detailed information about their products or services for your business.\n\nWrite at least 150 words.', minWords: 150, maxWords: 200 },
  { task: 1, level: 'B2', prompt: 'Your neighbor is planning to renovate their house and the work might be noisy. Write a polite letter asking them for more information about the work and how long it will take.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },
  { task: 1, level: 'B1', prompt: 'Write an email to a hotel to book a room for your upcoming vacation. Include your dates, requirements, and any special requests.\n\nWrite at least 120 words.', minWords: 120, maxWords: 150 },
  { task: 1, level: 'B2', prompt: 'You received a damaged product from an online store. Write a complaint letter requesting a refund or replacement. Explain what was wrong with the product.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },
  { task: 1, level: 'C1', prompt: 'Write a formal email to a university requesting information about their graduate programs, entry requirements, and application deadlines.\n\nWrite at least 150 words.', minWords: 150, maxWords: 200 },
  { task: 1, level: 'B2', prompt: 'You are organizing a charity event. Write an email to local businesses asking for sponsorship or donations to support the cause.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },
  { task: 1, level: 'B1', prompt: 'Write a letter to a tourist information office asking for recommendations about places to visit and things to do in their city.\n\nWrite at least 120 words.', minWords: 120, maxWords: 150 },
  { task: 1, level: 'B2', prompt: 'You recently stayed at a hotel and had a problem with the service. Write a formal email to the hotel manager explaining the problem and what you would like them to do.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },

  // Semi-formal (10)
  { task: 1, level: 'B2', prompt: 'Your company is introducing a new flexible working policy. Write an email to your manager requesting to work from home two days a week and explaining why this would benefit both you and the company.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },
  { task: 1, level: 'B1', prompt: 'You want to join a language course. Write an email to the school asking about course levels, schedules, fees, and how to register.\n\nWrite at least 120 words.', minWords: 120, maxWords: 150 },
  { task: 1, level: 'B2', prompt: 'Write an email to your local council suggesting an improvement to your neighborhood (e.g., a new park, better lighting, cycle paths). Explain why this would benefit the community.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },
  { task: 1, level: 'C1', prompt: 'You are applying for a scholarship to study abroad. Write a formal email explaining why you should be selected and how the scholarship would help you achieve your goals.\n\nWrite at least 150 words.', minWords: 150, maxWords: 200 },
  { task: 1, level: 'B2', prompt: 'Write an email to the editor of a local magazine suggesting a topic for an article. Explain why you think readers would be interested in this topic.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },
  { task: 1, level: 'B1', prompt: 'You are having a problem with public transport in your area. Write an email to the transport company explaining the problem and what you think should be done.\n\nWrite at least 120 words.', minWords: 120, maxWords: 150 },
  { task: 1, level: 'C1', prompt: 'Write a formal letter to a professional organization applying for membership. Explain your qualifications and why you want to join.\n\nWrite at least 150 words.', minWords: 150, maxWords: 200 },
  { task: 1, level: 'B2', prompt: 'Your library is planning to reduce its opening hours. Write a letter to the library expressing your concerns and suggesting alternative solutions.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },
  { task: 1, level: 'B1', prompt: 'Write an email to a friend of a friend who is visiting your city next month. Introduce yourself and offer to show them around.\n\nWrite at least 120 words.', minWords: 120, maxWords: 150 },
  { task: 1, level: 'B2', prompt: 'You want to volunteer for a community project. Write an email to the project coordinator introducing yourself, explaining your skills, and asking how you can help.\n\nWrite at least 140 words.', minWords: 140, maxWords: 180 },

  // ============ TASK 2: Opinion Essays (15 total) ============
  { task: 2, level: 'B2', prompt: 'Some people believe that studying abroad is beneficial for students, while others think it is better to study in their home country.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'C1', prompt: 'Technology has made our lives easier, but it has also created new problems.\n\nTo what extent do you agree or disagree with this statement? Give reasons and examples.\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'B2', prompt: 'Some people think that schools should focus more on practical skills rather than academic subjects.\n\nDiscuss both views and give your opinion.\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'C1', prompt: 'Climate change is one of the biggest challenges facing humanity today.\n\nWhat are the main causes of climate change and what solutions can you suggest?\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'B2', prompt: 'Many people believe that social media has a negative impact on young people.\n\nDo you agree or disagree? Give reasons and examples to support your answer.\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'C1', prompt: 'Governments should invest more money in public transportation rather than building new roads.\n\nTo what extent do you agree or disagree? Support your answer with examples.\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'B2', prompt: 'Some people think that the best way to learn a language is to live in a country where it is spoken.\n\nWhat are the advantages and disadvantages of this approach?\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'C1', prompt: 'The increasing use of artificial intelligence in the workplace will lead to widespread job losses.\n\nDiscuss the advantages and disadvantages of AI in the workplace.\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'B2', prompt: 'Online shopping is becoming more popular than traditional shopping in physical stores.\n\nWhat are the reasons for this trend? Is this a positive or negative development?\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'B2', prompt: 'Some people believe that children should start learning a foreign language at primary school rather than secondary school.\n\nDo the advantages outweigh the disadvantages? Explain your view.\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'C1', prompt: 'The gap between rich and poor is increasing in many countries around the world.\n\nWhat are the causes of this problem and what measures can be taken to address it?\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'B2', prompt: 'Many cities around the world are facing serious traffic congestion problems.\n\nWhat are the causes of this problem and what solutions can you suggest?\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'C1', prompt: 'Some people believe that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'B2', prompt: 'The internet has transformed the way information is shared and consumed, but it has also created problems that did not exist before.\n\nWhat are the most serious problems associated with the internet and what can be done to address them?\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
  { task: 2, level: 'C1', prompt: 'Many people argue that fast food companies should be required to provide healthier menu options and clearer nutritional information.\n\nTo what extent do you agree or disagree with this view?\n\nWrite at least 250 words.', minWords: 250, maxWords: 300 },
];

// ====================================
// SEED FUNCTIONS
// ====================================

async function login() {
  try {
    const { data } = await axios.post(`${API_URL}/auth/login`, {
      email: 'akmaljaxonkulov00@gmail.com',
      password: 'akmal1221',
    });
    return data.access_token;
  } catch (error) {
    console.error('❌ Login xatosi. Foydalanuvchi ma\'lumotlarini tekshiring.');
    return null;
  }
}

async function deleteOldQuestions(token) {
  console.log('\n🗑️  ESKI SAVOLLARNI O\'CHIRISH...\n');
  
  try {
    // Speaking savollarni o'chirish
    const speakingRes = await axios.get(`${API_URL}/ai-questions/speaking`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const speakingIds = speakingRes.data.map((q) => q.id);
    
    if (speakingIds.length > 0) {
      await axios.post(`${API_URL}/ai-questions/speaking/bulk-delete`, { ids: speakingIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`   ✅ ${speakingIds.length} ta speaking savol o'chirildi`);
    } else {
      console.log('   ℹ️  Speaking savollar topilmadi');
    }

    // Writing savollarni o'chirish
    const writingRes = await axios.get(`${API_URL}/ai-questions/writing`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const writingIds = writingRes.data.map((q) => q.id);
    
    if (writingIds.length > 0) {
      await axios.post(`${API_URL}/ai-questions/writing/bulk-delete`, { ids: writingIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`   ✅ ${writingIds.length} ta writing savol o'chirildi\n`);
    } else {
      console.log('   ℹ️  Writing savollar topilmadi\n');
    }

  } catch (error) {
    console.error('❌ O\'chirish xatosi:', error.response?.data?.message || error.message);
  }
}

async function seedQuestions(token) {
  console.log('🌱 YANGI REAL CEFR SAVOLLARNI QO\'SHISH...\n');
  
  let speakingCount = 0;
  let writingCount = 0;

  // Speaking Questions
  console.log('📢 Speaking savollar qo\'shilmoqda...');
  for (const q of speakingQuestions) {
    try {
      await axios.post(`${API_URL}/ai-questions/speaking`, {
        part: q.part,
        cefrLevel: q.level,
        questionText: q.question,
        timeLimitSeconds: q.time,
        isActive: true,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      speakingCount++;
      process.stdout.write(`   ✅ ${speakingCount}/${speakingQuestions.length}\r`);
    } catch (error) {
      console.error(`\n   ❌ Xato: ${error.response?.data?.message || error.message}`);
    }
  }
  console.log(`\n   ✅ Speaking: ${speakingCount}/${speakingQuestions.length} qo'shildi`);

  // Writing Questions
  console.log('\n✍️  Writing savollar qo\'shilmoqda...');
  for (const q of writingQuestions) {
    try {
      await axios.post(`${API_URL}/ai-questions/writing`, {
        task: q.task,
        cefrLevel: q.level,
        promptText: q.prompt,
        minWords: q.minWords,
        maxWords: q.maxWords,
        isActive: true,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      writingCount++;
      process.stdout.write(`   ✅ ${writingCount}/${writingQuestions.length}\r`);
    } catch (error) {
      console.error(`\n   ❌ Xato: ${error.response?.data?.message || error.message}`);
    }
  }
  console.log(`\n   ✅ Writing: ${writingCount}/${writingQuestions.length} qo'shildi`);

  console.log(`\n\n🎉 MUVAFFAQIYATLI YAKUNLANDI!\n`);
  console.log(`📊 JAMI STATISTIKA:`);
  console.log(`   🎤 Speaking: ${speakingCount} ta savol`);
  console.log(`      - Part 1 (Interview): 50 ta`);
  console.log(`      - Part 2 (Monologue): 20 ta`);
  console.log(`      - Part 3 (Discussion): 20 ta`);
  console.log(`   ✍️  Writing: ${writingCount} ta savol`);
  console.log(`      - Task 1 (Email/Letter): 30 ta`);
  console.log(`      - Task 2 (Essay): 15 ta`);
  console.log(`   📈 Umumiy: ${speakingCount + writingCount} ta REAL CEFR savol\n`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   🎓 REAL CEFR QUESTIONS SEED SCRIPT');
  console.log('   📚 Cambridge B1-C1 formatida savollar');
  console.log('═══════════════════════════════════════════════════\n');
  
  const token = await login();
  if (!token) {
    console.log('\n❌ Autentifikatsiya muvaffaqiyatsiz');
    console.log('   Backend ishga tushganligini va admin user mavjudligini tekshiring\n');
    return;
  }
  
  console.log('✅ Login muvaffaqiyatli\n');
  
  // Eski savollarni o'chirish
  await deleteOldQuestions(token);
  
  // Yangi savollarni qo'shish
  await seedQuestions(token);
}

main();
