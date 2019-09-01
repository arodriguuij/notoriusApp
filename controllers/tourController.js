const fs = require('fs');

const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));  // Because only execute once

// Middleware for the expecific parameter, filter for the tour doesnt exist
exports.checkID = (req, res, next, val) => {
    //console.log(`The ID is: ${val}`);

    const id = req.params.id * 1; // Convert string to a number

    if (id > tours.length) {
        return res.status(404).send({
            status: 'fail',
            message: 'Invalid ID'
        });
    }
    next();
};

// export. export more than one thing
exports.getAllTours = (req, res) => {    // v1 -> Version Api
    //console.log(req.requestTime);

    res.status(200).json({
        status: 'success',
        results: tours.length,
        requestedAt: req.requestTime, // Add parameter to the request
        data: {
            tours: tours
        }
    });
};

exports.getTour = (req, res) => {    // :id parameter  -   :id? optional parameter  
    const id = req.params.id * 1;
    const tour = tours.find(el => el.id == id);

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
};

exports.createTour = (req, res) => {
    const newId = tours[tours.length - 1].id + 1;
    const newTour = Object.assign({ id: newId }, req.body);

    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
        res.status(201).json({
            status: "success",
            data: {
                tour: newTour
            }
        })
    });
    tours.push(newTour);
};

exports.updateTour = (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            tour: '<Udapte tour here...>'
        }
    });
};

exports.deleteTour = (req, res) => {
    res.status(204).json({
        status: 'success',
        data: null
    });
};