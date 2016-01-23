---
title: Let's get swifty
date: 2016-01-24
layout: post.jade
lang: en
tags: swift bookmark
---

I'm surprised by the fact I haven't stumbled into a single article with this title and the proper Rick & Morty pun (*#FreeRick*). Anyways, no backend code tonight, it's been a long couple of weeks at work and university so this will be a short entry with a couple of patterns I've picked up around working with [swift](https://developer.apple.com/swift/). Just some random jiberish that I will most likely find useful in the future. I've done a tiny contribution to [learnxinyminutes/swift](https://learnxinyminutes.com/docs/swift/) & [learnxinyminutes/Obj-C](https://learnxinyminutes.com/docs/swift/) if you're new to the language, great starting point if you fancy some ***"hand's on learning"***. Everything on this post is ***heavily opinionated***, comments and alternate patterns are greatly appreciated. ![Get Schwifty](/img/get-swifty.jpg "Get Schwifty")

#### Extensions

This simple pattern for structuring your code definitely makes it nicer on the eye. Delegates and DataSources (`UITextFieldDelegate`, `UITextViewDelegate`, `UITableViewDataSource`, etc...) are the perfect example for extending your View Controllers inside their own class file (usually at the bottom), everything remains "encapsulated" and readable.

```
class HomeViewController : UIViewController {
  ...
}

extension HomeViewController : ReminderDetailDelegate {
    func saveReminder(reminder: ReminderItem) {
        self.items.append(reminder)
        ReminderManager.sharedManager().persistItems(reminder)
    }
}

extension HomeViewController : UITextFieldDelegate {
    func textField(textField: UITextField, shouldChangeCharactersInRange range: NSRange, replacementString string: String) -> Bool {
        let newString = NSString(string: textField.text!).stringByReplacingCharactersInRange(range, withString: string)
        if newString.characters.count > Validations.textFieldMaxLength {
            return false
        }
        return true
    }
}
```

#### Storyboards vs Nibs (Xibs)

Oldest discussion since fanboys on gaming consoles' specs & performance. My advice is probably close to the current community consensus, Storyboards on small projects and stay away from them for big ones, the catch is always the fine line that divides them both. The ***team's skill*** on each approach is critical of course.

Some setbacks for Storyboards are source control conflicts on a single storyboard and compile times skyrocket as the View Controller count starts to increase. I believe there are people with borderline pathological hatred against Storyboards, but those problems can be mitigated with multiple storyboards and fair knowledge of git (or alternate SVC solution). The decoupling and ease for ***agile changes*** one might achieve when developing a Nib-only project are subpar in comparison with Storyboards. But this requires more experienced developers that write clean code, a steeper learning curve for junior developers.

I've come to experiment with a mixture of the development speed boost of storyboards and leverage code-handled transitions/management. For example, the following images shows the storyboard of a simple 3 view app managed by a PageViewController (snapchat style).

![Small Storyboard](/img/small-storyboard.jpg "Small Storyboard")

The empty initial View Controller instantiates the PageViewController and performs delegate tasks for the PageViewControllerDataSource & Delegate protocols. The *Page Item Navigation Controller* is a subclass of UINavigationController for better management of a navigation stack in two of the View Controllers managed by the PageViewController. Transitions are wired by code, this actually gives more low-level capabilities since you can listen to more detailed delegate calls, like the UIScrollViewDelegate inside the PageViewController to know the exact offset when transitioning.

#### Localization (translations)

If the shit hits the fan and you need to localize your app there's probably two things on your mind: ***Disgust*** for having to spend time fixing Autolayout bugs (hopefully none at all, but do you really think that will ever happen?) and ***stress*** over the localization tools and comments that are never good enough for whoever translates your strings.

Since XCode 6.0 or so Apple introduced their localization import and export management using `.xliff` files. I've struggled with constant updates to strings during a run of months with the old Localizable.strings system, this new tool helps as long as your not using features that are way over your head. It's powerful, but you can hang yourself with all the rope Apple gives you, I prefer to avoid multiple storyboards for languages (same for Nibs).

I also avoid having strings (like placeholders or default labels) inside Interface Builder, since I don't really know how to change the default generated comments (that translators are going to read when doing their job) and they are not very explicit. We have to keep in mind they've never gazed at the masterpiece storyboard you've sculpted, that will obviously work when translated to arabic and strings reverse.

I lead my texts in Interface Builder with an underscore (*_*) to keep reminding me and whoever needs to work with my code knows that strings need to be initialized with `NSLocalizableString` and their proper context comment.

#### Obj-C foundation classes vs Swift's

Lots of times classes like `NSString` have changed their functions when translated to `String`, especially the ones that interact with `NSRange` and now work or need to be used in a different way. Not much to say here, its not pretty but I tend to use String classes for localization and more '*fresh*' language capabilities but always rely on creating a NSStrig out of a perfectly healthy String object to make use of a helper function. `stringByReplacingCharactersInRange` is a good example seen in the code snippet above.

The post went kind of long, will post again soon hopefully, I got a couple of fun projects cooking. In the mean time, ***peace among worlds!***

![Peace among worlds](/img/peace-among-worlds.gif "Peace among worlds")
