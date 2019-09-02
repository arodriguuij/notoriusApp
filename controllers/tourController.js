const Tour = require('../models/tourModel');

// export. export more than one thing
exports.getAllTours = async (req, res) => {    // v1 -> Version Api
    try{

        //BUILD QUERY
        //  1A) Filtering
        const queryObj = {...req.query}; //structuring --> '...'  new object --> '{}'
        //console.log(queryObj);
        const excludeFields = ['page', 'sort', 'limit', 'fields'];
        excludeFields.forEach(el => delete queryObj[el]);

        //  1B) Advance filtering
        // 127.0.0.1:3000/api/v1/tours?duration[gte]=5&difficulty=easy&sort=3&limit=10
        let queryStr = JSON.stringify(queryObj);

        // gte, gt, lte, lt  ----> $gte, $gt, $lte, $lt
        // "\b" only the exact string, no more
        // "g" replace everyone
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); 
        //console.log(JSON.parse(queryStr));

        // Transforming in a query to make aviable do more stuff
        let query = Tour.find(JSON.parse(queryStr));

        //  2)Sorting
        // 127.0.0.1:3000/api/v1/tours?sort=price   Ascendent order
        // 127.0.0.1:3000/api/v1/tours?sort=-price,-ratingAverage  Descendent order and with second criteria
        if(req.query.sort){
            const sortBy = req.query.sort.split(',').join(' '); // Delete "," and separate by space
            query = query.sort(sortBy); // query.sort('-price -ratingAverage')
        } else {
            query = query.sort('-createdAt');  //Default
        }


        //EXECUTE THE QUERY
        const tours = await query;

        // SEND RESPONSE
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