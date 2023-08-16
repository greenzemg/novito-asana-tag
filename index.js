const express = require("express");
const crypto = require("crypto");
const Asana = require('asana');
const Axios = require('axios')
// import axios from 'axios'

// Set your access token
const accessToken = '1/1204969888653581:d468e6d7d4e5806ab5ac9271fafa1eea';




/*---------------------------------------------------------*/
// Get All Exisintg tags from all workspace
// Function to fetch all tags from Novito.nl workspace using Asana API
/*---------------------------------------------------------*/
async function fetchTags(workspace_gid) {
  try {
    const response = await Axios.get(`https://app.asana.com/api/1.0/workspaces/${workspace_gid}/tags`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const tags = response.data.data;

    const tagDictionary = {}

    tags.forEach(item => {
      tagDictionary[item.name] = item.gid
    });

    console.log(tagDictionary)

    return tagDictionary;

  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}
// Example usage
// const workspace_gid = '1204969889418358';
// fetchTags(workspace_gid)
/*---------------------------------------------------------*/

/*---------------------------------------------------------*/
// First fetch the title of the task 
// Then, tokenize the returend title
/*---------------------------------------------------------*/
async function tokenizeTitleOfTask(taskGid) {
  const url = `https://app.asana.com/api/1.0/tasks/${taskGid}`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await Axios.get(url, { headers });
    const tagData = response.data.data;
    const title = tagData.name

    const tokensArray = title.split(/\s+/);

    return tokensArray;
  } catch (error) {
    console.error('Error fetching task details:', error.response ? error.response.data : error.message);
    return null;
  }
}
// Example usage
// taskGid = "1205255342453405"
// tokenizeTitleOfTask(taskGid)
/*---------------------------------------------------------*/

/*---------------------------------------------------------*/
// Return list of tags gid comparing the token with an existing all tags
/*---------------------------------------------------------*/
async function getTagidFromToken(tokens, allTagsDict) {
  const foundTagId = [];

  tokens.forEach(token => {
    if (allTagsDict.hasOwnProperty(token)) {
      foundTagId.push(allTagsDict[token])
    }
  });

  return foundTagId;
}
// Example usage
const tokens = ['task', 'for', 'test'];
const dictionary = {
  task: '1232',
  'be fore': '4423'
};

const foundValues = getTagidFromToken(tokens, dictionary);
console.log('Found Values:', foundValues);
/*---------------------------------------------------------*/

/*---------------------------------------------------------*/
// Function to add a tag to a task using Axios
/*---------------------------------------------------------*/
async function addTagToTask(taskId, tagId) {
  const url = `https://app.asana.com/api/1.0/tasks/${taskId}/addTag`;
  const headers = {
    accept: 'application/json',
    authorization: `Bearer ${accessToken}`,
    'content-type': 'application/json'
  };
  const data = {
    data: {
      tag: tagId
    }
  };

  try {
    const response = await Axios.post(url, data, { headers });
    console.log('Tag added successfully:', response.data);
  } catch (error) {
    console.error('Error:', error);
  }

}
// Example usage
// const taskId = '1205255342453405';
// const tagId = '1205079000251361';
// addTagToTask2(taskId, tagId);
/*---------------------------------------------------------*/


/*---------------------------------------------------------*/
// Add tags to given task id
async function addTagsToTask(taskGid, tagIds) {
  for (const tagId of tagIds) {
    await addTagToTask(taskGid, tagId);
  }
}
// Example usage
// const taskGid = '1205255342453405'; // Replace with the task GID you want to update
// const tagIds = ['1205087657916118', '1205085762777215']; // Replace with the tag IDs you want to add
// addTagsToTask(taskGid, tagIds);
/*---------------------------------------------------------*/

// Initializes Express app.
const app = express();

// Parses JSON bodies.
app.use(express.json());

// Global variable to store the x-hook-secret
// Read more about the webhook "handshake" here: https://developers.asana.com/docs/webhooks-guide#the-webhook-handshake
let secret = "";

// Local endpoint for receiving events
app.post("/receiveWebhook", (req, res) => {
  if (req.headers["x-hook-secret"]) {
    console.log("This is a new webhook");
    secret = req.headers["x-hook-secret"];
    console.log(req.headers)

    res.setHeader("X-Hook-Secret", secret);
    res.sendStatus(200);
  } else if (req.headers["x-hook-signature"]) {
    const computedSignature = crypto
      .createHmac("SHA256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(req.headers["x-hook-signature"]),
        Buffer.from(computedSignature)
      )
    ) {
      // Fail
      res.sendStatus(401);
    } else {
      // Success
      res.sendStatus(200);
      console.log(`Events on ${Date()}:`);
      console.log(req.body.events);


    }
  } else {
    console.error("Something went wrong! secret=", secret);
  }
});

// Home page
app.get("/home", (req, res) => {
  res.send("Novito Asana Management Tool");
})
app.listen(7070, () => {
  console.log(`Server started on port 7070`);
});
