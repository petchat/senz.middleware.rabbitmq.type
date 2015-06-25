var topology = {
    connection: {
        user: 'senz', pass: 'xiaosenz', server: '182.92.72.69', port: 5672, vhost: 'senz'
    },
    exchanges:[
        { name: 'new_motion_arrival_test', type: 'fanout' },
        { name: 'new_sound_arrival_test', type: 'fanout' },
        { name: 'new_location_arrival_test', type: 'fanout' },
        { name: 'new_motion_arrival_prod', type: 'fanout' },
        { name: 'new_sound_arrival_prod', type: 'fanout' },
        { name: 'new_location_arrival_prod', type: 'fanout' }
    ],
    queues:[],
    bindings:[]
};

exports.topology   = topology;