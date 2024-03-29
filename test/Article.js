// Import the required modules
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Use describe to group the tests
const Contract = "ArticlesContract120";
describe(Contract, function () {
  // Declare some variables to store the contract instance and the accounts
  let ArticlesContract;
  let aContract;
  let owner;
  let alice;
  let bob;

  // Use before to deploy the contract and get the accounts
  before(async function () {
    // Get the contract factory
    ArticlesContract = await ethers.getContractFactory(Contract);

    // Deploy the contract
    aContract = await ArticlesContract.deploy();

    // Get the accounts
    [owner, alice, bob] = await ethers.getSigners();
  });

  // Use describe to group the tests for the createArticle function
  describe("createArticle", function () {
    // Use it to write a test case
    it("Should create a new article with tags, time, and amount and emit an event", async function () {
      // Call the createArticle function with some content, tags, time, and amount from the owner account
      await expect(
        aContract.connect(owner).createArticle("Hello world", "greeting,test", { value: 10 })
      )
        .to.emit(aContract, "ArticleCreated") // Expect an ArticleCreated event to be emitted
        .withArgs(1, "Hello world", owner.address, 10); // Expect the event arguments to match the input and the owner address

      // Call the articles mapping with the article ID 1
      const article = await aContract.articles(1);

      // Expect the article details to match the input and the owner address
      expect(article.content).to.equal("Hello world");
      expect(article.owner).to.equal(owner.address);
      expect(article.tags).to.equal("greeting,test");
      expect(article.created).to.be.above(0);
      expect(article.amount).to.equal(10);
    });
  });

  // Use describe to group the tests for the exchangeArticle function
  describe("exchangeArticle", function () {
    // Use it to write another test case
    it("Should revert if article not marked for sale", async function () {
      // Call the exchangeArticle function with the article ID 1, alice's address, and a new amount of 10 from bob's account
      await expect(aContract.connect(alice).exchangeArticle(1, { value: 15 })).to.be.revertedWith(
        "Article not marked for sale"
      ); // Expect the transaction to be reverted with an error message
    });

    // Use it to write a test case
    it("Should mark article for sale", async function () {
      // Call the changeArticle function with the article ID 1 and some new content and tags from alice's account
      await expect(aContract.connect(owner).exchangeableArticle(1, true))
        .to.emit(aContract, "ArticleExchangeable") // Expect an ArticleExchangeable event to be emitted
        .withArgs(1, true); // Expect the event arguments to match the input and the old and new content and tags and the owner address

      // Call the articles mapping with the article ID 1
      const article = await aContract.articles(1);

      expect(article.exchangeable).to.equal(true);
    });

    // Use it to write a test case
    it("Should sell article to another user, pay fees and emit an event", async function () {
      // Call the exchangeArticle function with the article ID 1 and alice's address from the owner account
      await expect(aContract.connect(alice).exchangeArticle(1, { value: 15 }))
        .to.emit(aContract, "ArticleSold") // Expect an ArticlesContractd event to be emitted
        .withArgs(1, owner.address); // Expect the event arguments to match the input and the old and new owner addresses

      // Call the articles mapping with the article ID 1
      const article = await aContract.articles(1);

      // Expect the article details to remain unchanged except for the owner, which should be alice's address
      expect(article.content).to.equal("Hello world");
      expect(article.owner).to.equal(alice.address);
      expect(article.tags).to.equal("greeting,test");
      expect(article.created).to.be.above(0);
      expect(article.amount).to.greaterThan(10);
    });

    // Use it to write another test case
    it("Should revert if the new amount is less than or equal to the current amount", async function () {
      // Call the exchangeArticle function with the article ID 1, alice's address, and a new amount of 10 from bob's account
      await expect(aContract.connect(bob).exchangeArticle(1, { value: 10 })).to.be.revertedWith(
        "Exchange not profitable enough (>10%)"
      ); // Expect the transaction to be reverted with an error message
    });
  });

  // Use describe to group the tests for the changeArticle function
  describe("changeArticle", function () {
    // Use it to write another test case
    it("Should revert if the caller is not the owner of the article", async function () {
      // Call the changeArticle function with the article ID 1 and some new content and tags from bob's account
      await expect(aContract.connect(bob).exchangeableArticle(1, true)).to.be.revertedWith(
        "You are not the owner of this article"
      ); // Expect the transaction to be reverted with an error message
    });
  });

  // Use describe to group the tests for the getAllArticles function
  describe("getAllArticles", function () {
    // Use it to write a test case
    it("Should return an array of all articles", async function () {
      // Known articles so far
      const articleCount = 1;

      // Call the getAllArticles function and store the result
      const allArticles = await aContract.getAllArticles();

      // Expect the result to be an array of length equal to the article count
      expect(allArticles).to.be.an("array").that.has.lengthOf(articleCount);

      // Loop through the result array and check each article details
      for (let i = 0; i < articleCount; i++) {
        // Get the article ID from the array index
        let articleId = i + 1;

        // Get the expected article from the articles mapping
        let expectedArticle = await aContract.articles(articleId);

        // Expect the actual article to deep equal the expected article
        expect(allArticles[i]).to.deep.equal(expectedArticle);
      }
    });
  });
});
