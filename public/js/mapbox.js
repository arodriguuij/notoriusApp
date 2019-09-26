export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXJvZHJpZ3V1aWoiLCJhIjoiY2swemVpajNhMDJjNDNlbzR4bWVxcDhuMCJ9.Fswj0bLGhrs9e4jcUnCtDA';
    var map = new mapboxgl.Map({
        container: 'map', //ID html
        style: 'mapbox://styles/arodriguuij/ck0zeluxo04bs1blpmlemzt12',
        scrollZoom: false
        /*center: [-118.256004,34.036747],
        zoom: 10,
        interactive: false*/
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);

        // Add popup
        new mapboxgl.Popup({
            offset: 30
        }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);

        // Extend map bounds to include current location
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
};