#![allow(dead_code, unused_variables)]
use std::env;

const POWER: f64 = 1.0;
// const JUMP_POWER: f64 = 11.0;

struct InputParamaters {
    length_limit: i32,
    char_id: usize,
    start_x: f64,
    start_vel: f64,
    target_x: f64,
    target_vel: f64,
    x_window: f64,
    overflow_allowed: bool,
    check_pos: bool,
    check_vel: bool,
}

#[derive(Clone)]
struct Character {
    id: usize,
    x: f64,
    vx: f64,
    friction: f64,
    fric_goal: f64,
    // onob: bool,
}

impl Character {
	fn apply_forces(&mut self, /*is_control: bool*/) {
		// if (self.onob || is_control) {
			self.vx = (self.vx - self.fric_goal) * self.friction + self.fric_goal;
		// } else {
			// self.vx *= 1 - (1 - self.friction) * 0.12;
		// }

		if self.vx.abs() < 0.01 { self.vx = 0.0; }
	}

	fn char_move(&mut self) {
		self.x += self.vx;
	}

    fn move_horizontal(&mut self, power: f64) {
		self.vx += power;
    }
}

#[derive(Clone)]
#[derive(Debug)]
enum Key {
    Left,
    Right,
    Up,
    Down,
    Jump,
    Z,
    Enter,
}

fn main() {
    let mut params = InputParamaters {
        length_limit: 10,
        char_id: 1,
        start_x: 0.0,
        start_vel: 0.0,
        target_x: 0.0,
        target_vel: 0.0,
        x_window: 0.01,
        overflow_allowed: true,
        check_pos: true,
        check_vel: true,
    };

    let args: Vec<String> = env::args().collect();
    let mut args_iter = args.iter().peekable();
    while let Some(arg) = args_iter.next() {
        if arg.chars().nth(0) == Some('-') {
            let val = args_iter.peek();
            let val_is_some = !val.is_none();
            let mut advance = true;
            match arg.strip_prefix("-") {
                Some("l") if val_is_some => { params.length_limit = val.expect("Gaurd").parse().unwrap(); },
                Some("c") if val_is_some => { params.char_id = val.expect("Gaurd").parse().unwrap(); },
                Some("sx") if val_is_some => { params.start_x = val.expect("Gaurd").parse().unwrap(); },
                Some("sv") if val_is_some => { params.start_vel = val.expect("Gaurd").parse().unwrap(); },
                Some("tx") if val_is_some => { params.target_x = val.expect("Gaurd").parse().unwrap(); },
                Some("tv") if val_is_some => { params.target_vel = val.expect("Gaurd").parse().unwrap(); },
                Some("xwin") if val_is_some => { params.x_window = val.expect("Gaurd").parse().unwrap(); },
                Some("no_overflow") => { params.overflow_allowed = false; advance = false; },
                Some("anypos") => { params.check_pos = false; advance = false; },
                Some("anyvel") => { params.check_vel = false; advance = false; },
                _ => (),
            }
            if advance { args_iter.next(); }
        }
    }
    // dbg!(params.start_x, params.target_x, params.overflow_allowed);
    let mut state = Character {
        id: params.char_id,
        x: params.start_x,
        vx: params.start_vel,
        fric_goal: 0.0,
        friction: CHAR_D[params.char_id].friction,
        // onob: true,
    };
    simulate_frame(&params, &mut state, &vec![], 0);
}

fn simulate_frame(params: &InputParamaters, state: &mut Character, keys: &Vec<Vec<Key>>, depth: i32) {
    // Run physics
    if depth > 0 {
        match keys.last() {
            Some(this_frame_keys) => {
                for key in this_frame_keys.iter() {
                    match key {
                        Key::Left => { state.move_horizontal(-POWER) },
                        Key::Right => { state.move_horizontal(POWER) },
                        _ => (),
                    }
                }
            },
            None => ()
        }
        state.apply_forces();
        state.char_move();
    }

    // Check for clips
    let mut to_recurse = depth < params.length_limit;
    if ((!params.check_pos) || (params.check_pos && state.x-params.target_x < params.x_window && state.x-params.target_x > 0.0)) &&
        ((!params.check_vel) || (params.check_vel && state.vx.abs() <= 0.0 /*params.vel_thresh*/)) {
        println!("{} | {} with velocity {}", keys_to_string(&keys), state.x, state.vx);
        to_recurse = false;
    }

    // Recurse!
    if to_recurse {
        let mut new_keys = keys.clone();
        new_keys.push(vec![]);
        simulate_frame(params, &mut state.clone(), &new_keys, depth + 1);
        new_keys.last_mut().expect("A new element was just pushed").push(Key::Left);
        simulate_frame(params, &mut state.clone(), &new_keys, depth + 1);
        new_keys.last_mut().expect("A new element was just pushed")[0] = Key::Right;
        simulate_frame(params, &mut state.clone(), &new_keys, depth + 1);
    }
}

fn keys_to_string(keys: &Vec<Vec<Key>>) -> String {
    let mut keys_string: String = "".to_owned();
    let mut keys_iter = keys.iter().peekable();
    while let Some(frame) = keys_iter.next() {
        for key in frame.iter() {
            keys_string.push_str(match key {
                Key::Right => "R",
                Key::Left => "L",
                Key::Up => "U",
                Key::Down => "D",
                Key::Jump => "J",
                Key::Z => "Z",
                Key::Enter => "E",
            });
        }
        if frame.len() == 0 {
            keys_string.push_str("-");
        }
        if !keys_iter.peek().is_none() {
            keys_string.push_str(" ");
        }
    }
    keys_string
}

struct CharProperties {
    width: f64,
    height: f64,
    weight: f64,
    carry_y: f64,
    friction: f64,
    heat_speed: f64,
}

const CHAR_D: [CharProperties; 56] = [
     CharProperties {width: 28.0, height: 45.4, weight: 0.45, carry_y: 27.0, friction: 0.8, heat_speed: 1.0},
     CharProperties {width: 23.0, height: 56.0, weight: 0.36, carry_y: 31.0, friction: 0.8, heat_speed: 1.7},
     CharProperties {width: 20.0, height: 51.0, weight: 0.41, carry_y: 20.0, friction: 0.85, heat_speed: 5.0},
     CharProperties {width: 10.0, height: 86.0, weight: 0.26, carry_y: 31.0, friction: 0.8, heat_speed: 1.6},
     CharProperties {width: 10.0, height: 84.0, weight: 0.23, carry_y: 31.0, friction: 0.8, heat_speed: 1.4},
     CharProperties {width: 28.0, height: 70.0, weight: 0.075, carry_y: 28.0, friction: 0.8, heat_speed: 9.0},
     CharProperties {width: 26.0, height: 49.0, weight: 0.2, carry_y: 20.0, friction: 0.75, heat_speed: 0.6},
     CharProperties {width: 44.0, height: 65.0, weight: 0.8, carry_y: 20.0, friction: 0.75, heat_speed: 0.8},
     CharProperties {width: 16.0, height: 56.0, weight: 0.25, carry_y: 17.0, friction: 0.76, heat_speed: 0.8},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 0.0, height: 0.0, weight: 0.0, carry_y: 0.0, friction: 0.0, heat_speed: 1.0},
     CharProperties {width: 36.5, height: 72.8, weight: 1.0, carry_y: 20.0, friction: 0.6, heat_speed: 0.0},
     CharProperties {width: 15.1, height: 72.8, weight: 0.6, carry_y: 20.0, friction: 0.7, heat_speed: 0.0},
     CharProperties {width: 20.0, height: 40.0, weight: 0.15, carry_y: 20.0, friction: 0.7, heat_speed: 0.7},
     CharProperties {width: 25.0, height: 50.0, weight: 0.64, carry_y: 20.0, friction: 0.6, heat_speed: 0.1},
     CharProperties {width: 25.0, height: 10.0, weight: 1.0, carry_y: 5.0, friction: 0.7, heat_speed: 0.2},
     CharProperties {width: 25.0, height: 50.0, weight: 1.0, carry_y: 20.0, friction: 0.7, heat_speed: 0.1},
     CharProperties {width: 25.0, height: 29.0, weight: 0.1, carry_y: 20.0, friction: 0.8, heat_speed: 1.0},
     CharProperties {width: 21.5, height: 43.0, weight: 0.3, carry_y: 20.0, friction: 0.6, heat_speed: 0.5},
     CharProperties {width: 35.0, height: 60.0, weight: 1.0, carry_y: 20.0, friction: 0.7, heat_speed: 0.1},
     CharProperties {width: 22.5, height: 45.0, weight: 1.0, carry_y: 20.0, friction: 0.7, heat_speed: 0.8},
     CharProperties {width: 25.0, height: 50.0, weight: 1.0, carry_y: 20.0, friction: 0.7, heat_speed: 0.1},
     CharProperties {width: 15.0, height: 30.0, weight: 0.64, carry_y: 20.0, friction: 0.6, heat_speed: 0.2},
     CharProperties {width: 10.0, height: 55.0, weight: 0.8, carry_y: 20.0, friction: 0.3, heat_speed: 0.4},
     CharProperties {width: 45.0, height: 10.0, weight: 1.0, carry_y: 20.0, friction: 0.7, heat_speed: 0.2},
     CharProperties {width: 20.0, height: 40.0, weight: 1.0, carry_y: 20.0, friction: 0.8, heat_speed: 0.8},
     CharProperties {width: 16.0, height: 45.0, weight: 0.4, carry_y: 20.0, friction: 0.94, heat_speed: 1.1},
     CharProperties {width: 25.0, height: 10.0, weight: 1.0, carry_y: 20.0, friction: 0.7, heat_speed: 0.3},
     CharProperties {width: 45.0, height: 10.0, weight: 0.4, carry_y: 20.0, friction: 0.7, heat_speed: 0.7},
     CharProperties {width: 15.0, height: 50.0, weight: 0.1, carry_y: 20.0, friction: 0.8, heat_speed: 1.9},
     CharProperties {width: 25.0, height: 25.0, weight: 0.1, carry_y: 20.0, friction: 0.8, heat_speed: 1.7},
     CharProperties {width: 30.0, height: 540.0, weight: 10.0, carry_y: 20.0, friction: 0.4, heat_speed: 0.0},
];
