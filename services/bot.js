const fx = require('money');
const fetch = require('node-fetch');
fx.base = "USD";
fx.rates = {
    "EUR" : 0.745101,
    "GBP" : 0.647710,
    "HKD" : 7.781919,
    "USD" : 1,
    "UAH" : 26.78
}

//@bot Save note title: Title, body: body
//@bot show notes
//@bot show note Title

const ADVICES = [
  'Перестать пить газировку.',
'Бегать по 10 минут 4 раза в неделю.',
'Больше улыбаться.',
'Каждую неделю знакомиться с новым человеком.',
'Спать по расписанию.',
'Просыпаться на полчаса раньше, чем нужно.',
'Всегда иметь под рукой бутылку с водой.',
'Приходить в магазин со списком покупок и не ходить туда голодным.',
'Благодарить людей.'
]

const QUOTES = [
  'Цель жизни – это жизнь с целью (Роберт Бёрнс)',
  'Когда вы в гневе, не грешите. Пусть гнев ваш пройдет еще до захода солнца, не оставляйте дьяволу шансов (Эфесянам 4:26-27)',
  'Циник – человек, который знает всему цену, но ничего не ценит (Оскар Уайльд)',
  'Во всём есть своя красота, но её видит не каждый (Конфуций)',
  'Вас нельзя заставить чувствовать себя хуже без вашего же на то согласия (Элеонора Рузвельт)',
  'Доброта – это солнце, в лучах которого растёт добродетель (народная мудрость)',
  'Посмотрите – огромный лес можно поджечь одной маленькой искрой (Иаков 3:5)',
  'Путь в тысячу ли всегда начинается с первого шага (китайская пословица)',
  'Опыт есть отец мудрости (неизвестный автор)',
  'Хамелеон не слезет с одного дерева, пока не будет уверен, что впереди другое дерево (арабская пословица)'
]

const REGULAR = {
  weather: /What the weather in (\w+)/i,
  moneyExchange: /Convert (\d+) (.{3}) to (.{3})$/i,
  noteSave: /Save note title: (.+), body: (.+)/i ,
  noteShowList: /Show notes/i,
  noteShowOne: /Show note (.+)/i,
  noteDelete: /Delete note (.+)/i,
  advice: /.+\s+[#@)₴?$0]/i,
  quote: /show quote/i
}

const notes = [];


const APIKEY= '6f95b09a5d9b67f657b7a2ce95d85084';

// fetch(`http://api.openweathermap.org/data/2.5/weather?q=London&APPID=${apiKey}`)
const getWeather = (city) => {
   return fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${APIKEY}`)
      .then(res => res.json())
      .then(data => {
        return `Weather in ${city} is temperature - ${data.main.temp}, ${data.weather[0].description} `
      })
}





const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];



const prettyfyWeatherMsg = (day, text, tempr) => `${day} is ${text} ${tempr}`;




// @bot what the weather today in london
function getWeatherOnCurrentDay (data, day) {
  switch (day.toLowerCase()) {
    case 'today':
      return prettyfyWeatherMsg(data.current.day, data.current.skytext, data.current.temperature)
    case 'tomorow':
      return prettyfyWeatherMsg(data.forecast.day, data.forecast.skytext, data.forecast.tempreture)
    default:
      break;
  }
}



function check (text) {
  let res = Object.entries(REGULAR).
    reduce((curr, [theme, re]) => {
      if (text.match(re)) {
        curr[theme] = text.match(re)
      }
      return {...curr}
    }, {})
  return Object.keys(res).length === 0 ? false : res;

}


//Facade pattern
const mainFunctions = {
  weather: (city) => getWeather(city),
  moneyExchange: ({ amount, from, to }) => {
    let result = fx.convert(amount, {from:from,to:to})
    return `It will be ${result} ${to}`
  },
  noteSave: ({ title, body }) => {
    notes.push(
      {
      title,
      body
    }
    )
    return `Saved ${title}`
  },
  noteShowList: () =>  {
    let ans = ''
    let counter = 1;
    for (let note of notes) {
    ans += `${counter} - title: ${note.title}, body: ${note.body}`
    counter++
    }
    return ans
  },
  noteShowOne: ({ title }) => {
    try {
      let note = notes.filter((note) => note.title === title);
      return  `title: ${note[0].title}, body: ${note[0].body}`;
    } catch(error) {
      return  `Note with title: ${title} not exist`;
    }
  },
  noteDelete: ({ title }) => {
    notes = notes.filter((note) => note.title !== title);
    return  `Note with title: ${title} deleted`;
  },
  advice: () => getRandomItem(ADVICES),
  quote: () => getRandomItem(QUOTES)
}

function getParams(data) {
  if (data.weather) {
    let [, city] = data.weather
    return {city}
  }
  if (data.moneyExchange) {
    let [, amount, from, to] = data.moneyExchange
    return {amount:Number(amount), from: from.toUpperCase(), to: to.toUpperCase()}
  }
  if (data.noteSave) {
    let [, title, body] = data.noteSave
    return {title,body}
  }
  if (data.noteShowOne) {
    let [, title] = data.noteShowOne;
    return {title}
  }
  if (data.noteDelete) {
    let [, title] = data.noteDelete;
    return {title}
  }
}

//@bot convert 20 uah to usd


const communicate = (msg) => {
  let response = 'I do not understand'
  let text = msg.text.split(' ');
  text.shift();
  text = text.join(' ');
  let data = check(text)
  if (data) {
    let params = getParams(data);
    let functionName = Object.keys(data)[0];
    response = mainFunctions[functionName](params)
  }
  return {
    nick: 'BOT Waley',
    text: response
  }
}



const textListener = (text) => text.split(' ')[0] === '@bot';


module.exports =  {communicate, textListener};