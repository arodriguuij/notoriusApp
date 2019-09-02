const Tour = require('../models/tourModel');

// export. export more than one thing
exports.getAllTours = async (req, res) => {    // v1 -> Version Api
    try{
        const tours = await Tour.find();
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours
            }
        });    
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        })
    }
};

exports.getTour = async (req, res) => {    // :id parameter  -   :id? optional parameter  
    try{
        // Mogoose Way
        const tour = await Tour.findById(req.params.id); 
        // MongBD way :Tour.findOne({ _id: req.params.id})

        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        })
    }
};

exports.createTour = async (req, res) => {

/* OPTION 1
    const newTour = new Tour({ //data });
    newTour.save();
*/

// OPTION 2
    try{
        const newTour = await Tour.create(req.body);
        res.status(201).json({
            status: "success",
            data: {
                tour: newTour
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: 'Invalid data sent'
        });
    }

};

exports.updateTour = async (req, res) => {
    try{
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the modificated document
            runValidators: true // Run de validator again
        });
        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: 'Invalid data sent'
        });    
    }
};

exports.deleteTour = async (req, res) => {
    try{
        await Tour.findByIdAndRemove(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: 'Invalid data sent'
        });    
    }
};