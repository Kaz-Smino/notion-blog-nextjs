import { Client } from "@notionhq/client";

// Create a new instance of Client to interact with the Notion API
const databaseId = process.env.NOTION_DATABASE_ID;
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

/**
 * Returns a random integer between the specified values, inclusive.
 * The value is no lower than `min`, and is less than or equal to `max`.
 *
 * @param {number} minimum - The smallest integer value that can be returned, inclusive.
 * @param {number} maximum - The largest integer value that can be returned, inclusive.
 * @returns {number} - A random integer between `min` and `max`, inclusive.
 */
function getRandomInt(minimum, maximum) {
  const min = Math.ceil(minimum);
  const max = Math.floor(maximum);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to get a database with a specific ID
export const getDatabase = async () => {
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  // eslint-disable-next-line no-console
  console.log(`2. debug_getDatabase`);
  return response.results;
};

// Function to get a page with a specific ID
export const getPage = async (pageId) => {
  const response = await notion.pages.retrieve({ page_id: pageId });
  // eslint-disable-next-line no-console
  console.log(`debug_getPage`);
  return response;
};

// Function to get a page with a specific slug (part of URL)
export const getPageFromSlug = async (slug) => {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Slug",
      formula: {
        string: {
          equals: slug,
        },
      },
    },
  });
  // eslint-disable-next-line no-console
  console.log("When displaying the article: 1. getPageFromSlug");
  return response?.results?.[0] || {};
};

// Function to get child blocks of a block with a specific ID
// If a child block has its own child blocks, those are fetched recursively
// Bulleted list items and numbered list items are grouped into their respective lists
export const getBlocks = async (blockID) => {
  const blockId = blockID.replaceAll("-", "");
  // eslint-disable-next-line no-console
  console.log("When displaying the article: 2. getBlocks");
  const { results } = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  });

  // Fetches all child blocks recursively
  // be mindful of rate limits if you have large amounts of nested blocks
  // See https://developers.notion.com/docs/working-with-page-content#reading-nested-blocks
  const childBlocks = results.map(async (block) => {
    if (block.has_children) {
      const children = await getBlocks(block.id);
      return { ...block, children };
    }
    return block;
  });

  return Promise.all(childBlocks).then((blocks) =>
    blocks.reduce((acc, curr) => {
      if (curr.type === "bulleted_list_item") {
        if (acc[acc.length - 1]?.type === "bulleted_list") {
          acc[acc.length - 1][acc[acc.length - 1].type].children?.push(curr);
        } else {
          acc.push({
            id: getRandomInt(10 ** 99, 10 ** 100).toString(),
            type: "bulleted_list",
            bulleted_list: { children: [curr] },
          });
        }
      } else if (curr.type === "numbered_list_item") {
        if (acc[acc.length - 1]?.type === "numbered_list") {
          acc[acc.length - 1][acc[acc.length - 1].type].children?.push(curr);
        } else {
          acc.push({
            id: getRandomInt(10 ** 99, 10 ** 100).toString(),
            type: "numbered_list",
            numbered_list: { children: [curr] },
          });
        }
      } else {
        acc.push(curr);
      }
      return acc;
    }, [])
  );
};

// Function to get data when a page is rendered server-side
export async function getServerSideProps() {
  const database = await getDatabase();

  // eslint-disable-next-line no-console
  console.log(`debug_getServerSideProps`);
  return {
    props: {
      database,
    },
  };
}

// Function to get data when a page is generated statically at build time
// The page is re-generated every hour
export async function getStaticProps() {
  const database = await getDatabase();

  // eslint-disable-next-line no-console
  console.log(`debug_getStaticProps`);
  return {
    props: {
      database,
    },
    revalidate: 3600, // Re-generate the page every hour
  };
}
