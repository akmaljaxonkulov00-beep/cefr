/**
 * DIRECT DATABASE SEED - Multiple Speaking Questions
 * Uses Prisma directly without needing backend API
 */

// Run from backend directory: node ../seed-speaking-direct.js
const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

// PART 1 QUESTION SETS (3-4 questions each)
const part1Sets = [
  "What's your full name?\n\nWhere are you from?\n\nCan you tell me about your hometown?\n\nWhat do you like about living there?",
  "Do you work or study?\n\nWhat do you do?\n\nWhy did you choose this job/subject?\n\nDo you enjoy it?",
  "What do you do in your free time?\n\nDo you have any hobbies?\n\nHow often do you do them?\n\nWould you like to try any new hobbies?",
  "Do you like reading?\n\nWhat kind of books do you enjoy?\n\nDid you read much as a child?\n\nDo you think reading is important?",
  "Do you like music?\n\nWhat kind of music do you listen to?\n\nCan you play any musical instruments?\n\nDo you prefer listening to music alone or with others?",
  "Do you like sports?\n\nWhat sports do you play or watch?\n\nDid you play sports when you were younger?\n\nDo you think children should play sports?",
  "What's your favorite food?\n\nDo you like cooking?\n\nDo you prefer eating at home or in restaurants?\n\nHas your diet changed over the years?",
  "Do you like traveling?\n\nWhere have you traveled to?\n\nWhat's your favorite place you've visited?\n\nWhere would you like to travel in the future?",
  "What's the weather like in your hometown?\n\nWhat's your favorite season?\n\nDoes the weather affect your mood?\n\nHas the weather changed in recent years?",
  "Do you use technology often?\n\nWhat devices do you use every day?\n\nHas technology made your life easier?\n\nDo you think you use technology too much?",
  "Do you have many friends?\n\nHow did you meet your best friend?\n\nWhat do you like to do with your friends?\n\nIs it easy to make new friends?",
  "Do you like shopping?\n\nWhat do you usually shop for?\n\nDo you prefer shopping online or in stores?\n\nHave your shopping habits changed?",
  "Do you like watching movies?\n\nWhat kind of movies do you enjoy?\n\nDo you prefer watching movies at home or in the cinema?\n\nWho's your favorite actor or actress?",
  "What time do you usually wake up?\n\nWhat's the first thing you do in the morning?\n\nDo you have a regular daily routine?\n\nWould you like to change anything about your routine?",
  "How do you usually travel to work/school?\n\nWhat's the traffic like in your city?\n\nDo you prefer public transport or driving?\n\nHas transportation improved in your area?"
];

// PART 2 TOPICS (Monolog with cue card)
const part2Topics = [
  {
    topic: "Describe a memorable journey you have made",
    cue: "You should say:\n- Where you went\n- When it was\n- Who you went with\n- And explain why it was memorable"
  },
  {
    topic: "Describe a person who has influenced you",
    cue: "You should say:\n- Who this person is\n- How you met them\n- What they did\n- And explain how they influenced you"
  },
  {
    topic: "Describe a book or film you enjoyed",
    cue: "You should say:\n- What it was about\n- When you read/watched it\n- Why you chose it\n- And explain why you enjoyed it"
  },
  {
    topic: "Describe a skill you would like to learn",
    cue: "You should say:\n- What the skill is\n- Why you want to learn it\n- How you would learn it\n- And explain how it would help you"
  },
  {
    topic: "Describe a place you like to visit",
    cue: "You should say:\n- Where it is\n- How often you go there\n- What you do there\n- And explain why you like this place"
  },
  {
    topic: "Describe an important decision you made",
    cue: "You should say:\n- What the decision was\n- When you made it\n- What the result was\n- And explain why it was important"
  },
  {
    topic: "Describe a festival or celebration you attended",
    cue: "You should say:\n- What the celebration was\n- Where and when it took place\n- Who was there\n- And explain what you enjoyed about it"
  },
  {
    topic: "Describe a teacher who helped you",
    cue: "You should say:\n- Who this teacher was\n- What subject they taught\n- How they helped you\n- And explain why they were important"
  },
  {
    topic: "Describe a piece of technology you find useful",
    cue: "You should say:\n- What it is\n- When you got it\n- How often you use it\n- And explain why it's useful"
  },
  {
    topic: "Describe a childhood memory",
    cue: "You should say:\n- What the memory is\n- When it happened\n- Who was involved\n- And explain why you remember it"
  },
  {
    topic: "Describe a goal you have for the future",
    cue: "You should say:\n- What the goal is\n- Why you want to achieve it\n- How you plan to achieve it\n- And explain how it will change your life"
  },
  {
    topic: "Describe a difficult situation you overcame",
    cue: "You should say:\n- What the situation was\n- When it happened\n- How you dealt with it\n- And explain what you learned"
  },
  {
    topic: "Describe a hobby you enjoy",
    cue: "You should say:\n- What the hobby is\n- When you started it\n- Why you enjoy it\n- And explain how it benefits you"
  },
  {
    topic: "Describe a positive change in your life",
    cue: "You should say:\n- What the change was\n- When it happened\n- How it happened\n- And explain why it was positive"
  },
  {
    topic: "Describe a historical place you visited",
    cue: "You should say:\n- Where it is\n- When you visited it\n- What you learned there\n- And explain why it interested you"
  }
];

// PART 3 QUESTION SETS (3-4 analytical questions each)
const part3Sets = [
  "How has tourism changed in your country?\n\nWhat are the advantages and disadvantages of tourism?\n\nDo you think space tourism will become common?\n\nHow can countries promote sustainable tourism?",
  "How has education changed in recent years?\n\nShould university education be free?\n\nWhat skills should schools teach?\n\nHow will education change in the future?",
  "How has technology changed communication?\n\nWhat are the negative effects of technology?\n\nWill technology replace human workers?\n\nHow can we balance technology use?",
  "What are the biggest environmental problems today?\n\nWho should be responsible for protecting the environment?\n\nCan individuals really make a difference?\n\nHow will climate change affect future generations?",
  "How have lifestyles changed in recent years?\n\nWhat factors influence people's health choices?\n\nShould governments control what people eat?\n\nHow can we encourage healthier lifestyles?",
  "How has the workplace changed?\n\nWhat makes a good work-life balance?\n\nWill people work less in the future?\n\nWhat skills will be important for future jobs?",
  "How have family structures changed?\n\nWhat role do grandparents play today?\n\nHow has parenting changed?\n\nWhat challenges do modern families face?",
  "How has social media changed society?\n\nWhat are the effects of celebrity culture?\n\nShould there be limits on media content?\n\nHow will entertainment change in the future?",
  "Why is it important to preserve traditions?\n\nHow is globalization affecting local cultures?\n\nShould young people learn about their culture?\n\nCan traditional and modern values coexist?",
  "What are the advantages of living in cities?\n\nHow can cities become more sustainable?\n\nWhat problems do large cities face?\n\nWill more people live in cities in the future?",
  "How has shopping changed in recent years?\n\nWhat makes people buy things they don't need?\n\nAre we becoming too materialistic?\n\nHow can we promote responsible consumption?",
  "Why is learning languages important?\n\nWill English become the only global language?\n\nHow is technology affecting language?\n\nWhat's the best way to learn a language?",
  "Why are the arts important in society?\n\nShould governments fund the arts?\n\nHow has technology changed art?\n\nWill artificial intelligence replace human creativity?",
  "What causes crime in society?\n\nHow can crime be reduced?\n\nIs prison an effective punishment?\n\nHow has technology affected crime?",
  "What are the benefits of globalization?\n\nWhat are the disadvantages?\n\nHow does globalization affect local businesses?\n\nWill globalization continue to increase?"
];

async function seedQuestions() {
  try {
    console.log('🗑️  Clearing existing questions...');
    await prisma.aiSpeakingQuestion.deleteMany({});
    console.log('✅ Cleared\n');
    
    let totalAdded = 0;
    
    // Seed Part 1 Sets
    console.log('📝 Seeding Part 1 questions...');
    for (let i = 0; i < part1Sets.length; i++) {
      await prisma.aiSpeakingQuestion.create({
        data: {
          part: 1,
          cefrLevel: 'B1',
          questionText: part1Sets[i],
          topicCard: null,
          timeLimitSeconds: 240,
          isActive: true
        }
      });
      totalAdded++;
      console.log(`  ✅ Part 1 Set ${i + 1}/${part1Sets.length}`);
    }
    
    // Seed Part 2 Topics
    console.log('\n📝 Seeding Part 2 topics...');
    for (let i = 0; i < part2Topics.length; i++) {
      await prisma.aiSpeakingQuestion.create({
        data: {
          part: 2,
          cefrLevel: 'B2',
          questionText: part2Topics[i].topic,
          topicCard: part2Topics[i].cue,
          timeLimitSeconds: 180,
          isActive: true
        }
      });
      totalAdded++;
      console.log(`  ✅ Part 2 Topic ${i + 1}/${part2Topics.length}`);
    }
    
    // Seed Part 3 Sets
    console.log('\n📝 Seeding Part 3 questions...');
    for (let i = 0; i < part3Sets.length; i++) {
      await prisma.aiSpeakingQuestion.create({
        data: {
          part: 3,
          cefrLevel: 'B2',
          questionText: part3Sets[i],
          topicCard: null,
          timeLimitSeconds: 300,
          isActive: true
        }
      });
      totalAdded++;
      console.log(`  ✅ Part 3 Set ${i + 1}/${part3Sets.length}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEEDING COMPLETE!');
    console.log('='.repeat(50));
    console.log(`✅ Total Added: ${totalAdded} question sets`);
    console.log(`   Part 1: ${part1Sets.length} sets (3-4 questions each)`);
    console.log(`   Part 2: ${part2Topics.length} topics`);
    console.log(`   Part 3: ${part3Sets.length} sets (3-4 questions each)`);
    console.log('\n💡 Each part will now show different questions randomly!');
    console.log('🔄 Frontend will fetch random questions on each "Boshlash" click.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
seedQuestions();
