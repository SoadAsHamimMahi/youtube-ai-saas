function clean(title: string, company: string) {
  let cleanTitle = title
    .replace(/we are \W*hiring( for)?/i, '')
    .replace(/[*#]/g, '')
    .replace(/[()]/g, ' ') // remove parentheses which confuse LinkedIn boolean search
    .replace(/&/g, 'and') // replace & with and
    .trim();

  if (company) {
    const escapedCompany = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const companyRegex = new RegExp(escapedCompany, 'ig');
    cleanTitle = cleanTitle.replace(companyRegex, '').trim();
  }

  // Remove leftover dashes, pipes, colons, spaces at start/end
  cleanTitle = cleanTitle.replace(/^[-|:\s]+|[-|:\s]+$/g, '').trim();

  if (cleanTitle.length > 75) {
    cleanTitle = cleanTitle.substring(0, 75).trim();
  }

  const keywords = ((company ? company + " " : "") + cleanTitle).replace(/\s+/g, ' ').trim();
  return keywords;
}

console.log(clean("Full Stack Developer (ReactJS & Node.js) - Orangetoolz", "Orangetoolz"));
console.log(clean("We are #Hiring for - **Full Stack Developer (PHP & React)", "Nazmus Sakib"));
console.log(clean("Full Stack Developer(ReactJS & Node.js)", "atB Jobs"));
console.log(clean("Jobs - Orangetoolz", "Orangetoolz"));
console.log(clean("Full Stack Engineer (React Js & Node Js)  - orangetoolz.com", "LinkedIn"));
console.log(clean("Hiring Jr. Frontend Web Developer (React.js) at Soft IT Security", "Soft IT Security"));
