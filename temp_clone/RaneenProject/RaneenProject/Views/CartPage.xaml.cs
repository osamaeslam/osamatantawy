using Newtonsoft.Json;
using RaneenProject.Data;
using RaneenProject.DataService;
using RaneenProject.Models;
using RaneenProject.ViewModels;
using System.Collections.ObjectModel;
using Xamarin.Essentials;
using Xamarin.Forms.Internals;
using Xamarin.Forms.Xaml;

namespace RaneenProject.Views
{
    /// <summary>
    /// Page to show the cart list. 
    /// </summary>
    [Preserve(AllMembers = true)]
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class CartPage
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="CartPage" /> class.
        /// </summary>
        public CartPage()
        {
            this.InitializeComponent();
            getList();
        }
        public async void getList()
        {
            UsersDB dB = new UsersDB();
            Firebase.Auth.FirebaseAuth savedfirebaseauth = JsonConvert.DeserializeObject<Firebase.Auth.FirebaseAuth>(Preferences.Get("MyFirebaseRefreshToken", ""));

            if (savedfirebaseauth != null)
            {
                Users logedin = await dB.GetUser(savedfirebaseauth.User.Email);
                this.BindingContext = new CartPageViewModel()
                {
                    CartDetails = JsonConvert.DeserializeObject<ObservableCollection<Product>>(logedin.Cart)

                };


            }
            else
            {
                this.BindingContext = new CartPageViewModel()
                {
                    CartDetails = new ObservableCollection<Product>() 

                };
            }


        }
    }
}