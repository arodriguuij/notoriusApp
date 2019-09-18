class APIFeatures {
  // query - Mongo query
  // queryString- came from express(route)
  constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
  }

  filter() {
      //  1A) Filtering
      const queryObj = { ...this.queryString }; //structuring --> '...'  new object --> '{}'
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
      //let query = Tour.find(JSON.parse(queryStr));
      this.query = this.query.find(JSON.parse(queryStr));

      return this;
  };

  sort() {
      // 127.0.0.1:3000/api/v1/tours?sort=price   Ascendent order
      // 127.0.0.1:3000/api/v1/tours?sort=-price,-ratingsAverage  Descendent order and with second criteria
      //console.log(this.queryString === true);

      if (this.queryString.sort) {
          const sortBy = this.queryString.sort.split(',').join(' '); // Delete "," and separate by space
          //console.log(sortBy);
          this.query = this.query.sort(sortBy); // query.sort('-price -ratingsAverage')
      } else {
          this.query = this.query.sort('-createdAt');  //Default
      }
      return this;
  };

  limitFields() {
      // 127.0.0.1:3000/api/v1/tours?fields=name,duration,difficulty,price
      if (this.queryString.fields) {
          const fields = this.queryString.fields.split(',').join(' ');
          this.query = this.query.select(fields);
      } else {
          // Exclude key      "__v": 0
          this.query = this.query.select('-__v');  // exclude "-" + key
      }
      return this;
  };

  pagination() {
      if(this.queryString.page){
          const page = this.queryString.page * 1 || 1; // Convert string to number and default 1
          const limit = this.queryString.limit * 1 || 100;
          const skip = (page - 1) * limit;
  
          this.query = this.query.skip(skip).limit(limit);
      } else {
          const page = 1; // Convert string to number and default 1
          const limit = 100;
          const skip = (page - 1) * limit;
  
          this.query = this.query.skip(skip).limit(limit);
      }
      return this;
  };
};

module.exports = APIFeatures;