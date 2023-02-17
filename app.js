const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error :{e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//Returns a list of all states in the state table
const convertToCamel = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};
app.get("/states/", async (request, response) => {
  const stateRequest = `SELECT * FROM state;`;
  const stateResponse = await db.all(stateRequest);
  response.send(stateResponse.map((state) => convertToCamel(state)));
});

//Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateRequest = `SELECT * FROM state WHERE state_id=${stateId};`;
  const getStateResponse = await db.get(getStateRequest);
  response.send(convertToCamel(getStateResponse));
});

//Create a district in the district table, `district_id` is auto-incremented
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postRequest = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths) VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const postResponse = await db.run(postRequest);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID
const districtCamel = (district) => {
  return {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const specificDistrictRequest = `SELECT * FROM district WHERE district_id=${districtId};`;
  const specificDistrictResponse = await db.get(specificDistrictRequest);
  response.send(districtCamel(specificDistrictResponse));
});

//Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteRequest = `DELETE FROM district WHERE district_id=${districtId};`;
  const deleteResponse = await db.run(deleteRequest);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const putRequest = `UPDATE district set district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths} WHERE district_id=${districtId};`;
  const updateResponse = await db.run(putRequest);
  response.send("District Details Updated");
});
//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsRequest = `SELECT sum(cases) AS totalCases ,sum(cured) AS totalCured,sum(active) AS totalActive,sum(deaths) AS  totalDeaths FROM district WHERE state_id=${stateId};`;
  const statsResponse = await db.get(statsRequest);
  response.send(statsResponse);
});
//Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdRequest = `SELECT state_id from district WHERE district_id=${districtId};`;
  const getDistrictResponse = await db.get(getDistrictIdRequest);
  const getStateNameRequest = `select state_name as stateName from state where state_id=${getDistrictResponse.state_id};`;
  const getStateNameResponse = await db.get(getStateNameRequest);
  response.send(getStateNameResponse);
});
module.exports = app;
