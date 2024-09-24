export function convertTo24HourFormat(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }
    if (modifier === 'PM' && hours !== 12) {
      hours += 12;
    }
    const hours24 = hours.toString().padStart(2, '0');
    const minutes24 = minutes.padStart(2, '0');
  
    return `${hours24}:${minutes24}`;
  }