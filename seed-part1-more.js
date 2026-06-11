/**
 * PART 1 - 35 TA YANGI SAVOL SET QO'SHISH
 * Hozirda: 15 ta
 * Qo'shiladi: 35 ta
 * Jami: 50 ta
 */

const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

// 35 TA YANGI PART 1 QUESTION SETS (3-4 questions each)
const newPart1Sets = [
  // 16. Learning & Education
  "How do you prefer to learn new things?\n\nDo you enjoy studying?\n\nWhat was your favorite subject at school?\n\nWould you like to study abroad?",
  
  // 17. Colors
  "What's your favorite color?\n\nDo colors affect your mood?\n\nAre certain colors more popular in your country?\n\nDo you wear clothes in bright colors?",
  
  // 18. Animals & Pets
  "Do you like animals?\n\nDo you have any pets?\n\nWhat animals are popular in your country?\n\nWould you like to have a pet in the future?",
  
  // 19. Fashion & Clothes
  "Are you interested in fashion?\n\nWhat kind of clothes do you like wearing?\n\nDo you prefer comfortable or fashionable clothes?\n\nHas your style changed over the years?",
  
  // 20. Sleep & Dreams
  "How many hours do you usually sleep?\n\nDo you take naps during the day?\n\nDo you remember your dreams?\n\nIs it easy for you to fall asleep?",
  
  // 21. Gifts
  "Do you like giving gifts?\n\nWhat was the best gift you ever received?\n\nIs it difficult to choose gifts for others?\n\nDo you prefer to give practical or fun gifts?",
  
  // 22. Weekends
  "How do you usually spend your weekends?\n\nDo you prefer relaxing or being active on weekends?\n\nDo you think weekends are long enough?\n\nWhat did you do last weekend?",
  
  // 23. Neighbors
  "Do you know your neighbors well?\n\nDo you think it's important to have good neighbors?\n\nWhat qualities make a good neighbor?\n\nHave you ever helped your neighbors?",
  
  // 24. Birthdays
  "How do you usually celebrate your birthday?\n\nDo you enjoy birthday parties?\n\nWhat was your most memorable birthday?\n\nAre birthdays important in your culture?",
  
  // 25. Numbers
  "Are you good at remembering numbers?\n\nDo you have a favorite number?\n\nAre certain numbers considered lucky in your culture?\n\nDo you prefer letters or numbers?",
  
  // 26. Photos
  "Do you like taking photos?\n\nWhat do you usually take photos of?\n\nDo you prefer taking photos with a camera or phone?\n\nDo you share your photos on social media?",
  
  // 27. Nature
  "Do you like spending time in nature?\n\nWhat natural places do you like visiting?\n\nDo you think cities have enough green spaces?\n\nHow often do you go to parks?",
  
  // 28. Seasons
  "Which season do you like most?\n\nHow does the weather change through the year in your country?\n\nDo you prefer hot or cold weather?\n\nDoes the season affect what you do?",
  
  // 29. Social Media
  "Do you use social media?\n\nWhich social media platforms do you use?\n\nHow much time do you spend on social media daily?\n\nDo you think social media is useful?",
  
  // 30. Shoes
  "Do you like buying new shoes?\n\nWhat kind of shoes do you prefer?\n\nDo you have many pairs of shoes?\n\nAre comfortable shoes important to you?",
  
  // 31. Time Management
  "Are you good at managing your time?\n\nDo you often feel rushed?\n\nHow do you organize your daily tasks?\n\nDo you use a planner or calendar?",
  
  // 32. Languages
  "How many languages can you speak?\n\nWhy are you learning English?\n\nIs it difficult to learn a new language?\n\nWould you like to learn more languages?",
  
  // 33. Concentration
  "Do you find it easy to concentrate?\n\nWhat helps you focus?\n\nDo you get distracted easily?\n\nWhere do you concentrate best?",
  
  // 34. Holidays & Festivals
  "What's your favorite holiday?\n\nHow do people celebrate festivals in your country?\n\nDo you prefer traditional or modern celebrations?\n\nWhat did you do on your last holiday?",
  
  // 35. Handwriting
  "Do you prefer writing by hand or typing?\n\nDo you have good handwriting?\n\nHow often do you write by hand?\n\nDo you think handwriting is still important?",
  
  // 36. Changes
  "Do you like changes in your life?\n\nWhat changes have you made recently?\n\nDo you think change is usually positive?\n\nIs it easy for you to adapt to changes?",
  
  // 37. Noise
  "Does noise bother you?\n\nWhat's the noisiest place you know?\n\nDo you prefer silence or background noise?\n\nHow do you deal with noisy environments?",
  
  // 38. Vegetables & Fruit
  "Do you like eating vegetables?\n\nWhat's your favorite fruit?\n\nDo you eat enough fruits and vegetables?\n\nAre fruits and vegetables expensive in your country?",
  
  // 39. Morning Routine
  "Are you a morning person?\n\nWhat's the first thing you do after waking up?\n\nHow long does your morning routine take?\n\nDo you have breakfast every day?",
  
  // 40. Concentration & Focus
  "What helps you stay focused?\n\nDo you work better in the morning or evening?\n\nHow do you avoid distractions?\n\nDo you take breaks when studying or working?",
  
  // 41. Bags
  "What kind of bag do you use daily?\n\nDo you have many bags?\n\nWhat do you usually carry in your bag?\n\nHave you ever lost your bag?",
  
  // 42. Chocolate
  "Do you like chocolate?\n\nHow often do you eat chocolate?\n\nDid you like chocolate when you were a child?\n\nWhat's your favorite type of chocolate?",
  
  // 43. Singing
  "Do you like singing?\n\nCan you sing well?\n\nDo you sing when you're alone?\n\nHave you ever sung in public?",
  
  // 44. Age
  "Do you think age is important?\n\nWhat's a good age to get married?\n\nDo you want to be young forever?\n\nWhat's the best thing about your current age?",
  
  // 45. Advertisements
  "Do you pay attention to advertisements?\n\nWhat kind of ads do you like or dislike?\n\nHave you ever bought something because of an ad?\n\nDo you think there are too many ads nowadays?",
  
  // 46. Stars & Sky
  "Do you like looking at the sky?\n\nCan you see stars from where you live?\n\nHave you ever studied the stars?\n\nDo you prefer the day sky or night sky?",
  
  // 47. Punctuality
  "Are you usually on time?\n\nDo you think being punctual is important?\n\nWhat do you do if someone is late?\n\nHas anyone ever been late for an important event with you?",
  
  // 48. Staying Up Late
  "Do you often stay up late?\n\nWhat do you do when you stay up late?\n\nDid you stay up late when you were younger?\n\nWhat are the effects of staying up late?",
  
  // 49. Forgetting Things
  "Do you often forget things?\n\nWhat kinds of things do you forget?\n\nHow do you remember important things?\n\nHave you ever forgotten something very important?",
  
  // 50. Patience
  "Are you a patient person?\n\nWhat makes you impatient?\n\nDo you think patience is important?\n\nHave you become more patient over time?"
];

async function addMorePart1Questions() {
  try {
    console.log('📊 Checking current Part 1 questions...');
    const currentCount = await prisma.aiSpeakingQuestion.count({
      where: { part: 1, isActive: true }
    });
    console.log(`✅ Current Part 1 questions: ${currentCount}\n`);
    
    console.log('📝 Adding 35 new Part 1 question sets...');
    let added = 0;
    
    for (let i = 0; i < newPart1Sets.length; i++) {
      await prisma.aiSpeakingQuestion.create({
        data: {
          part: 1,
          cefrLevel: 'B1',
          questionText: newPart1Sets[i],
          topicCard: null,
          timeLimitSeconds: 240,
          isActive: true
        }
      });
      added++;
      console.log(`  ✅ Added Set ${i + 1}/${newPart1Sets.length}`);
    }
    
    const newTotal = await prisma.aiSpeakingQuestion.count({
      where: { part: 1, isActive: true }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 PART 1 QUESTIONS UPDATED!');
    console.log('='.repeat(50));
    console.log(`✅ Added: ${added} new sets`);
    console.log(`📊 Previous total: ${currentCount}`);
    console.log(`📊 New total: ${newTotal}`);
    console.log(`🎯 Target: 50 (${newTotal >= 50 ? '✅ Achieved!' : `❌ Need ${50 - newTotal} more`})`);
    console.log('\n💡 Random savollar yanada ko\'proq xilma-xil bo\'ladi!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
addMorePart1Questions();
