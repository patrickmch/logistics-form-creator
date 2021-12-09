function summerLogisticsSheets() {
  // include the moment library and make `moment` object available to make date manipulation easier
  eval(UrlFetchApp.fetch('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js').getContentText());

  function getFormResponses(){
    let form = FormApp.openById("1XiMy5mCChjeuGPBYO_yaJ3M41rw_eCaTW-Q285anMM0");
    let formResponses = form.getResponses();
    let latestResponse = formResponses[formResponses.length-1]
    let itemResponses = latestResponse.getItemResponses();
    let responses = []
    for (let i = 0; i < itemResponses.length; i++) {
      let itemResponse = itemResponses[i].getResponse();
      responses.push(itemResponse)
    }
    return responses
  }

  let responses = getFormResponses()
  var courseType = responses[2]
  var courseStart = responses[3]
  var courseStartFormatted = moment(courseStart).format("MM/DD/YYYY")
  var courseCode = courseType + " " + courseStartFormatted
  var courseEnd = responses[4]
  var isClimbCourse = (responses[7] === "Yes") ? true : false
  var beginZone = parseInt(responses[9])
  var endZone = parseInt(responses[10])

  let replacementText = {
    "pSup" : responses[0],
    "instructors" : responses[1],
    "dropOffLocation" : responses[5],
    "pickUpLocation" : responses[6],
    "rationsStatus" : responses[8],
  }

  function determineStartTime(isClimbCourse){
    let startTime = {}
    if (isClimbCourse === true) {
      startTime["startTime"] = "8:00"
      startTime["fullOrHalf"] = "full"
    } else {
      startTime["startTime"] = "1:00"
      startTime["fullOrHalf"] = "half"
    }
    return startTime
  }
  replacementText = Object.assign(replacementText, determineStartTime(isClimbCourse))

  function calculateBriefingDays(){
    let outputDateFormat = "dddd, MMMM Do"
    let briefingDays = {
      briefingDayOne: moment(courseStart).subtract(3, 'd').format(outputDateFormat),
      briefingDayTwo: moment(courseStart).subtract(2, 'd').format(outputDateFormat),
      briefingDayThree: moment(courseStart).subtract(1, 'd').format(outputDateFormat),
      contractEnd: moment(courseEnd).add(1, 'd').format(outputDateFormat),
      courseStart: moment(courseStart).format(outputDateFormat),
      courseEnd: moment(courseEnd).format(outputDateFormat),
      courseCode: courseCode
    }
    return briefingDays
  }
  replacementText = Object.assign(replacementText, calculateBriefingDays())

  function makeZoneDescriptions(){
    const zoneDictionary = {
      1 : ["Zone 1 - Lower field, closest to Fremont Hall (farthest from the bridge)", "Zone 1 - Under the awning by the picnic tables"],
      2 : ["Zone 2 - Lower field, by the bridge", "Zone 2 - Bay closest to the front office"],
      3 : ["Zone 3 - Upper field, closest to bathroom house", "Zone 3 - Bay closest to the showers"],
      4 : ["Zone 4 - Upper field, farthest up the hill", "Zone 4 - Vinzer lot"]
    }
    let zonesObj = {
      asiZone: zoneDictionary[beginZone][0],
      rmZone: zoneDictionary[beginZone][1],
      asiZoneEnd: zoneDictionary[endZone][0],
      rmZoneEnd: zoneDictionary[endZone][1]
    }
    return zonesObj
  }
  replacementText = Object.assign(replacementText, makeZoneDescriptions())

  function getTemplateBody(){
    const templateId = "1eWTwRKbuIK-veLMgEbVGi5ColJWcklpTNUw22ITn730"
    const title = courseStartFormatted + " " + courseType + " Logistics Sheet"
    const newId = DriveApp.getFileById(templateId).makeCopy(title).getId()
    const doc = DocumentApp.openById(newId)
    const body = doc.getBody()
    return body
  }
  let body = getTemplateBody()

  function rationsAndTranspoBriefingTimes(){
    let newText = "\tTranspo briefing - Instructors should bring map quad for pick-up location"
    let briefingTimes = {
      "Monday": ["1:00", "2:00", "1:30"],
      "Friday": ["2:15", "2:45", "1:00"]
    }
    const keys = Object.keys(briefingTimes)
    for (const key of keys){
      if (replacementText["briefingDayOne"].includes(key)){
        body.replaceText("{{transpoBriefing" + key + "}}", newText)
        body.replaceText("{{transpoTime" + key + "}}", briefingTimes[key][0])
        body.replaceText("{{rationsTime}}", briefingTimes[key][1])
        body.replaceText("{{dayTwoStartTime}}", briefingTimes[key][2])
      }
      if (!replacementText["briefingDayOne"].includes(key)){
        body.replaceText("{{transpoTime"+ key + "}}" + "{{transpoBriefing" + key + "}}", "")
      }
    }
  }

  function replaceTemplateText(){
    const keys = Object.keys(replacementText)
    for (const key of keys) {
      body.replaceText("{{" + key + "}}", replacementText[key]);
    }
  }
  replaceTemplateText()
  rationsAndTranspoBriefingTimes()
}
